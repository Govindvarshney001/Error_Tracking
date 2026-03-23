import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAlertRule extends Document {
  name: string;
  description: string;
  type: 'threshold' | 'new_error' | 'error_spike' | 'service_down';
  enabled: boolean;
  
  // Threshold configuration
  threshold?: {
    count: number;           // Error count threshold
    windowMinutes: number;   // Time window in minutes
  };
  
  // Spike detection configuration  
  spikeConfig?: {
    multiplier: number;      // e.g., 3x normal rate
    baselineMinutes: number; // Period to calculate baseline
  };
  
  // Scope filters
  filters: {
    services?: string[];     // Apply to specific services (empty = all)
    environments?: string[]; // Apply to specific environments
    errorLevels?: string[];  // Apply to specific error levels
  };
  
  // Alert configuration
  alertSeverity: 'critical' | 'high' | 'medium' | 'low';
  cooldownMinutes: number;   // Minimum time between alerts for same condition
  
  // Metadata
  createdBy: string;
  updatedBy?: string;
  lastTriggeredAt?: Date;
}

const AlertRuleSchema = new Schema<IAlertRule>(
  {
    name: {
      type: String,
      required: [true, 'Rule name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      required: true,
      enum: ['threshold', 'new_error', 'error_spike', 'service_down'],
      index: true,
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    threshold: {
      count: { type: Number },
      windowMinutes: { type: Number },
    },
    spikeConfig: {
      multiplier: { type: Number },
      baselineMinutes: { type: Number },
    },
    filters: {
      services: [{ type: String }],
      environments: [{ type: String }],
      errorLevels: [{ type: String }],
    },
    alertSeverity: {
      type: String,
      required: true,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    cooldownMinutes: {
      type: Number,
      default: 15,
      min: 1,
    },
    createdBy: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: String,
    },
    lastTriggeredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient rule lookups
AlertRuleSchema.index({ enabled: 1, type: 1 });

export const AlertRuleModel: Model<IAlertRule> =
  mongoose.models.AlertRule || mongoose.model<IAlertRule>('AlertRule', AlertRuleSchema);
