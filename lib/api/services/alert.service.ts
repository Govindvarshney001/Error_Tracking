import { AlertModel, IAlert } from "../models/alert.model";
import { emitAlertTriggered, emitAlertUpdated } from "./realtime.service";

export interface CreateAlertInput {
  title: string;
  message: string;
  type: "error_spike" | "new_error" | "threshold_breach" | "service_down";
  severity: "critical" | "high" | "medium" | "low";
  service: string;
  environment: string;
  errorGroupId?: string;
  metadata?: Record<string, unknown>;
}

export interface AlertQueryParams {
  status?: string;
  severity?: string;
  service?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class AlertService {
  /**
   * Create a new alert
   */
  static async createAlert(input: CreateAlertInput): Promise<IAlert> {
    const alert = new AlertModel({
      ...input,
      triggeredAt: new Date(),
      status: "active",
    });

    await alert.save();

    // Emit real-time event for new alert
    emitAlertTriggered({
      id: alert._id.toString(),
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      service: alert.service,
      type: alert.type,
    });

    return alert;
  }

  /**
   * Get paginated list of alerts
   */
  static async getAlerts(
    params: AlertQueryParams,
  ): Promise<PaginatedResult<IAlert>> {
    const { status, severity, service, type, page = 1, limit = 20 } = params;

    const filter: Record<string, string> = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (service) filter.service = service;
    if (type) filter.type = type;

    const total = await AlertModel.countDocuments(filter);

    const alerts = await AlertModel.find(filter)
      .sort({ triggeredAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);

    return {
      data: alerts as unknown as IAlert[],
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get alert by ID
   */
  static async getAlertById(id: string): Promise<IAlert | null> {
    return AlertModel.findById(id);
  }

  /**
   * Acknowledge an alert
   */
  static async acknowledgeAlert(
    id: string,
    acknowledgedBy: string,
  ): Promise<IAlert | null> {
    const alert = await AlertModel.findByIdAndUpdate(
      id,
      {
        status: "acknowledged",
        acknowledgedAt: new Date(),
        acknowledgedBy,
      },
      { new: true },
    );

    // Emit real-time event for alert status change
    if (alert) {
      emitAlertUpdated({
        id: alert._id.toString(),
        status: alert.status,
        service: alert.service,
      });
    }

    return alert;
  }

  /**
   * Resolve an alert
   */
  static async resolveAlert(
    id: string,
    resolvedBy: string,
  ): Promise<IAlert | null> {
    const alert = await AlertModel.findByIdAndUpdate(
      id,
      {
        status: "resolved",
        resolvedAt: new Date(),
        resolvedBy,
      },
      { new: true },
    );

    // Emit real-time event for alert resolution
    if (alert) {
      emitAlertUpdated({
        id: alert._id.toString(),
        status: alert.status,
        service: alert.service,
      });
    }

    return alert;
  }

  /**
   * Get alert statistics
   */
  static async getAlertStats() {
    const [activeCount, acknowledgedCount, resolvedCount, bySeverity] =
      await Promise.all([
        AlertModel.countDocuments({ status: "active" }),
        AlertModel.countDocuments({ status: "acknowledged" }),
        AlertModel.countDocuments({ status: "resolved" }),
        AlertModel.aggregate([
          { $match: { status: { $ne: "resolved" } } },
          { $group: { _id: "$severity", count: { $sum: 1 } } },
        ]),
      ]);

    return {
      activeCount,
      acknowledgedCount,
      resolvedCount,
      bySeverity: bySeverity.reduce(
        (acc, item) => ({ ...acc, [item._id]: item.count }),
        {},
      ),
    };
  }
}
