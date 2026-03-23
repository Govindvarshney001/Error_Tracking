import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IError extends Document {
  message: string;
  stack: string;
  service: string;
  environment: string;
  level: 'error' | 'warning' | 'info';
  timestamp: Date;
  metadata: Record<string, unknown>;
  groupId: string;
  occurrenceCount: number;
  firstSeen: Date;
  lastSeen: Date;
  status: 'unresolved' | 'resolved' | 'ignored';
  assignedTo?: string;
  tags: string[];
}

const ErrorSchema = new Schema<IError>(
  {
    message: {
      type: String,
      required: [true, 'Error message is required'],
      trim: true,
      index: true,
    },
    stack: {
      type: String,
      required: [true, 'Stack trace is required'],
    },
    service: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      index: true,
    },
    environment: {
      type: String,
      required: [true, 'Environment is required'],
      enum: ['production', 'staging', 'development', 'test'],
      index: true,
    },
    level: {
      type: String,
      required: [true, 'Error level is required'],
      enum: ['error', 'warning', 'info'],
      default: 'error',
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    groupId: {
      type: String,
      required: true,
      index: true,
    },
    occurrenceCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    firstSeen: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastSeen: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['unresolved', 'resolved', 'ignored'],
      default: 'unresolved',
      index: true,
    },
    assignedTo: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient queries
ErrorSchema.index({ service: 1, timestamp: -1 });
ErrorSchema.index({ groupId: 1, timestamp: -1 });
ErrorSchema.index({ service: 1, level: 1, status: 1 });
ErrorSchema.index({ environment: 1, timestamp: -1 });

// Unique index on groupId to prevent duplicate groups under concurrent requests
ErrorSchema.index({ groupId: 1 }, { unique: true });

// Static method to generate group ID from error signature
ErrorSchema.statics.generateGroupId = function (
  message: string,
  stack: string,
  service: string
): string {
  const crypto = require('crypto');
  // Extract first line of stack trace for grouping
  const stackFirstLine = stack.split('\n')[0] || '';
  const signature = `${service}:${message}:${stackFirstLine}`;
  return crypto.createHash('sha256').update(signature).digest('hex').slice(0, 16);
};

export const ErrorModel: Model<IError> =
  mongoose.models.Error || mongoose.model<IError>('Error', ErrorSchema);
