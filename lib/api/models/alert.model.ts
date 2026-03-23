import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAlert extends Document {
  title: string;
  message: string;
  type: 'error_spike' | 'new_error' | 'threshold_breach' | 'service_down';
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'acknowledged' | 'resolved';
  service: string;
  environment: string;
  errorGroupId?: string;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  resolvedBy?: string;
  metadata: Record<string, unknown>;
}

const AlertSchema = new Schema<IAlert>(
  {
    title: {
      type: String,
      required: [true, 'Alert title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Alert message is required'],
    },
    type: {
      type: String,
      required: true,
      enum: ['error_spike', 'new_error', 'threshold_breach', 'service_down'],
      index: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved'],
      default: 'active',
      index: true,
    },
    service: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    environment: {
      type: String,
      required: true,
      enum: ['production', 'staging', 'development', 'test'],
    },
    errorGroupId: {
      type: String,
      index: true,
    },
    triggeredAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    acknowledgedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    acknowledgedBy: {
      type: String,
    },
    resolvedBy: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
AlertSchema.index({ status: 1, triggeredAt: -1 });
AlertSchema.index({ service: 1, status: 1 });
AlertSchema.index({ 'metadata.deduplicationKey': 1, triggeredAt: -1 });

export const AlertModel: Model<IAlert> =
  mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
