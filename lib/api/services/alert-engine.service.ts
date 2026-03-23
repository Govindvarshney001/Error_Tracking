import crypto from 'crypto';
import { AlertRuleModel, IAlertRule } from '../models/alert-rule.model';
import { AlertModel, IAlert } from '../models/alert.model';
import { ErrorModel } from '../models/error.model';

export interface AlertEngineResult {
  rulesEvaluated: number;
  alertsTriggered: number;
  alertsSkipped: number;
  errors: string[];
}

export interface RuleEvaluationResult {
  triggered: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export class AlertEngineService {
  /**
   * Generate a deduplication key for an alert condition
   * Used to prevent duplicate alerts for the same condition
   */
  static generateDeduplicationKey(
    ruleId: string,
    conditionType: string,
    scope: Record<string, unknown>
  ): string {
    const signature = `${ruleId}:${conditionType}:${JSON.stringify(scope)}`;
    return crypto.createHash('sha256').update(signature).digest('hex').slice(0, 24);
  }

  /**
   * Check if an alert already exists for this condition within the cooldown period
   */
  static async isDuplicateAlert(
    deduplicationKey: string,
    cooldownMinutes: number
  ): Promise<boolean> {
    const cooldownStart = new Date(Date.now() - cooldownMinutes * 60 * 1000);
    
    const existingAlert = await AlertModel.findOne({
      'metadata.deduplicationKey': deduplicationKey,
      triggeredAt: { $gte: cooldownStart },
      status: { $ne: 'resolved' },
    });

    return !!existingAlert;
  }

  /**
   * Evaluate a threshold rule
   * Triggers if error count exceeds threshold within time window
   */
  static async evaluateThresholdRule(rule: IAlertRule): Promise<RuleEvaluationResult> {
    if (!rule.threshold) {
      return { triggered: false, reason: 'No threshold configuration' };
    }

    const { count: thresholdCount, windowMinutes } = rule.threshold;
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    // Build filter based on rule scope
    const matchFilter: Record<string, unknown> = {
      timestamp: { $gte: windowStart },
    };

    if (rule.filters.services && rule.filters.services.length > 0) {
      matchFilter.service = { $in: rule.filters.services };
    }
    if (rule.filters.environments && rule.filters.environments.length > 0) {
      matchFilter.environment = { $in: rule.filters.environments };
    }
    if (rule.filters.errorLevels && rule.filters.errorLevels.length > 0) {
      matchFilter.level = { $in: rule.filters.errorLevels };
    }

    // Count total occurrences in the window (sum of occurrenceCount for each group)
    const result = await ErrorModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalOccurrences: { $sum: '$occurrenceCount' },
          uniqueErrors: { $sum: 1 },
        },
      },
    ]);

    const totalOccurrences = result[0]?.totalOccurrences || 0;

    if (totalOccurrences >= thresholdCount) {
      return {
        triggered: true,
        reason: `Error count (${totalOccurrences}) exceeded threshold (${thresholdCount}) in ${windowMinutes} minute window`,
        metadata: {
          totalOccurrences,
          threshold: thresholdCount,
          windowMinutes,
          filters: rule.filters,
        },
      };
    }

    return { triggered: false };
  }

  /**
   * Evaluate an error spike rule
   * Triggers if current error rate is significantly higher than baseline
   */
  static async evaluateSpikeRule(rule: IAlertRule): Promise<RuleEvaluationResult> {
    if (!rule.spikeConfig) {
      return { triggered: false, reason: 'No spike configuration' };
    }

    const { multiplier, baselineMinutes } = rule.spikeConfig;
    const now = new Date();
    
    // Calculate baseline (average rate over baseline period, excluding last 5 minutes)
    const baselineEnd = new Date(now.getTime() - 5 * 60 * 1000);
    const baselineStart = new Date(baselineEnd.getTime() - baselineMinutes * 60 * 1000);
    
    // Current period (last 5 minutes)
    const currentStart = new Date(now.getTime() - 5 * 60 * 1000);

    // Build filter based on rule scope
    const baseFilter: Record<string, unknown> = {};
    if (rule.filters.services && rule.filters.services.length > 0) {
      baseFilter.service = { $in: rule.filters.services };
    }
    if (rule.filters.environments && rule.filters.environments.length > 0) {
      baseFilter.environment = { $in: rule.filters.environments };
    }

    // Get baseline count
    const baselineResult = await ErrorModel.aggregate([
      {
        $match: {
          ...baseFilter,
          timestamp: { $gte: baselineStart, $lt: baselineEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$occurrenceCount' } } },
    ]);

    // Get current count
    const currentResult = await ErrorModel.aggregate([
      {
        $match: {
          ...baseFilter,
          timestamp: { $gte: currentStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$occurrenceCount' } } },
    ]);

    const baselineTotal = baselineResult[0]?.total || 0;
    const currentTotal = currentResult[0]?.total || 0;

    // Calculate baseline rate per 5 minutes
    const baselineRatePer5Min = (baselineTotal / baselineMinutes) * 5;
    const expectedRate = Math.max(baselineRatePer5Min, 1); // Minimum of 1 to avoid division issues

    if (currentTotal >= expectedRate * multiplier && currentTotal >= 5) {
      return {
        triggered: true,
        reason: `Error spike detected: ${currentTotal} errors in last 5 minutes (${multiplier}x above baseline of ${expectedRate.toFixed(1)})`,
        metadata: {
          currentCount: currentTotal,
          baselineRate: expectedRate,
          multiplier,
          baselineMinutes,
        },
      };
    }

    return { triggered: false };
  }

  /**
   * Check for new error groups that appeared recently
   */
  static async evaluateNewErrorRule(rule: IAlertRule): Promise<RuleEvaluationResult[]> {
    const windowMinutes = rule.threshold?.windowMinutes || 5;
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    // Build filter
    const filter: Record<string, unknown> = {
      firstSeen: { $gte: windowStart },
      occurrenceCount: 1, // Only count truly new errors
    };

    if (rule.filters.services && rule.filters.services.length > 0) {
      filter.service = { $in: rule.filters.services };
    }
    if (rule.filters.environments && rule.filters.environments.length > 0) {
      filter.environment = { $in: rule.filters.environments };
    }

    const newErrors = await ErrorModel.find(filter).limit(10).lean();

    return newErrors.map((error) => ({
      triggered: true,
      reason: `New error detected: ${error.message.slice(0, 100)}`,
      metadata: {
        errorGroupId: error.groupId,
        service: error.service,
        environment: error.environment,
        message: error.message,
      },
    }));
  }

  /**
   * Create an alert with deduplication
   */
  static async createAlertWithDeduplication(
    rule: IAlertRule,
    result: RuleEvaluationResult,
    deduplicationScope: Record<string, unknown>
  ): Promise<IAlert | null> {
    const deduplicationKey = this.generateDeduplicationKey(
      rule._id.toString(),
      rule.type,
      deduplicationScope
    );

    // Check for duplicate
    const isDuplicate = await this.isDuplicateAlert(deduplicationKey, rule.cooldownMinutes);
    if (isDuplicate) {
      return null;
    }

    // Create the alert
    const alert = new AlertModel({
      title: `[${rule.type.toUpperCase()}] ${rule.name}`,
      message: result.reason,
      type: rule.type === 'threshold' ? 'threshold_breach' : rule.type,
      severity: rule.alertSeverity,
      status: 'active',
      service: rule.filters.services?.[0] || 'all-services',
      environment: rule.filters.environments?.[0] || 'production',
      errorGroupId: (result.metadata?.errorGroupId as string) || undefined,
      triggeredAt: new Date(),
      metadata: {
        ...result.metadata,
        ruleId: rule._id.toString(),
        ruleName: rule.name,
        deduplicationKey,
      },
    });

    await alert.save();

    // Update rule's last triggered timestamp
    await AlertRuleModel.findByIdAndUpdate(rule._id, { lastTriggeredAt: new Date() });

    return alert;
  }

  /**
   * Run the alert engine - evaluate all enabled rules
   */
  static async runAlertEngine(): Promise<AlertEngineResult> {
    const result: AlertEngineResult = {
      rulesEvaluated: 0,
      alertsTriggered: 0,
      alertsSkipped: 0,
      errors: [],
    };

    try {
      // Get all enabled rules
      const rules = await AlertRuleModel.find({ enabled: true });
      result.rulesEvaluated = rules.length;

      for (const rule of rules) {
        try {
          switch (rule.type) {
            case 'threshold': {
              const evalResult = await this.evaluateThresholdRule(rule);
              if (evalResult.triggered) {
                const alert = await this.createAlertWithDeduplication(
                  rule,
                  evalResult,
                  { type: 'threshold', filters: rule.filters }
                );
                if (alert) {
                  result.alertsTriggered++;
                } else {
                  result.alertsSkipped++;
                }
              }
              break;
            }

            case 'error_spike': {
              const evalResult = await this.evaluateSpikeRule(rule);
              if (evalResult.triggered) {
                const alert = await this.createAlertWithDeduplication(
                  rule,
                  evalResult,
                  { type: 'spike', filters: rule.filters }
                );
                if (alert) {
                  result.alertsTriggered++;
                } else {
                  result.alertsSkipped++;
                }
              }
              break;
            }

            case 'new_error': {
              const evalResults = await this.evaluateNewErrorRule(rule);
              for (const evalResult of evalResults) {
                if (evalResult.triggered && evalResult.metadata?.errorGroupId) {
                  const alert = await this.createAlertWithDeduplication(
                    rule,
                    evalResult,
                    { type: 'new_error', groupId: evalResult.metadata.errorGroupId }
                  );
                  if (alert) {
                    result.alertsTriggered++;
                  } else {
                    result.alertsSkipped++;
                  }
                }
              }
              break;
            }

            default:
              result.errors.push(`Unknown rule type: ${rule.type}`);
          }
        } catch (error) {
          result.errors.push(`Error evaluating rule ${rule.name}: ${error}`);
        }
      }
    } catch (error) {
      result.errors.push(`Error running alert engine: ${error}`);
    }

    return result;
  }

  /**
   * Auto-resolve alerts when their conditions are no longer met
   */
  static async autoResolveAlerts(): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Auto-resolve threshold/spike alerts that haven't recurred in an hour
    const result = await AlertModel.updateMany(
      {
        status: 'active',
        type: { $in: ['threshold_breach', 'error_spike'] },
        triggeredAt: { $lt: oneHourAgo },
      },
      {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: 'auto-resolve',
      }
    );

    return result.modifiedCount;
  }
}
