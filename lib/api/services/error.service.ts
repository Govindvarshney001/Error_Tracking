import crypto from 'crypto';
import { ErrorModel, IError } from '../models/error.model';
import { AlertService } from './alert.service';
import { emitNewError, emitErrorUpdated } from './realtime.service';

export interface CreateErrorInput {
  message: string;
  stack: string;
  service: string;
  environment: string;
  level?: 'error' | 'warning' | 'info';
  timestamp?: number;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface ErrorQueryParams {
  service?: string;
  environment?: string;
  level?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GroupedError {
  groupId: string;
  message: string;
  service: string;
  environment: string;
  level: string;
  status: string;
  occurrenceCount: number;
  firstSeen: Date;
  lastSeen: Date;
  tags: string[];
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

export class ErrorService {
  /**
   * Normalize stack trace by removing variable parts (line numbers, memory addresses, timestamps)
   * This ensures similar errors group together even if minor details differ
   */
  static normalizeStackTrace(stack: string): string {
    return stack
      // Remove line numbers and column numbers (e.g., :123:45 or :123)
      .replace(/:\d+:\d+/g, ':X:X')
      .replace(/:\d+\)/g, ':X)')
      // Remove memory addresses (e.g., 0x7fff5fbff8c0)
      .replace(/0x[a-fA-F0-9]+/g, '0xXXX')
      // Remove UUIDs
      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID')
      // Remove timestamps in common formats
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, 'TIMESTAMP')
      // Remove file paths that include node_modules version numbers
      .replace(/node_modules\/[^/]+@[\d.]+/g, 'node_modules/PKG')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generate a unique group ID for error deduplication using SHA-256
   * Uses normalized stack trace to ensure similar errors are grouped together
   */
  static generateGroupId(message: string, stack: string, service: string): string {
    // Normalize message (remove variable data like IDs, timestamps)
    const normalizedMessage = message
      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID')
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, 'TIMESTAMP')
      .replace(/\b\d{10,}\b/g, 'ID'); // Remove long numeric IDs

    // Normalize and extract first meaningful stack frame
    const normalizedStack = this.normalizeStackTrace(stack);
    const stackLines = normalizedStack.split('\n').filter(line => line.trim());
    const significantFrame = stackLines.slice(0, 3).join('|'); // Use first 3 frames
    
    const signature = `${service}:${normalizedMessage}:${significantFrame}`;
    return crypto.createHash('sha256').update(signature).digest('hex').slice(0, 16);
  }

  /**
   * Ingest a new error - either create new or increment existing
   * Uses atomic findOneAndUpdate with upsert to prevent race conditions
   */
  static async ingestError(input: CreateErrorInput): Promise<IError> {
    const groupId = this.generateGroupId(input.message, input.stack, input.service);
    const timestamp = input.timestamp ? new Date(input.timestamp) : new Date();

    // Build update operation for atomic upsert
    const updateOperation: Record<string, unknown> = {
      $inc: { occurrenceCount: 1 },
      $set: { lastSeen: timestamp },
      $setOnInsert: {
        message: input.message,
        stack: input.stack,
        service: input.service,
        environment: input.environment,
        level: input.level || 'error',
        timestamp,
        groupId,
        firstSeen: timestamp,
        status: 'unresolved',
      },
    };

    // Add metadata merge if provided
    if (input.metadata) {
      updateOperation.$set = {
        ...(updateOperation.$set as Record<string, unknown>),
        'metadata.lastOccurrence': input.metadata,
      };
    }

    // Add tags if provided (using $addToSet to avoid duplicates)
    if (input.tags && input.tags.length > 0) {
      updateOperation.$addToSet = { tags: { $each: input.tags } };
    } else {
      // Set empty tags array on insert if no tags provided
      (updateOperation.$setOnInsert as Record<string, unknown>).tags = [];
    }

    // Atomic upsert - creates if not exists, updates if exists
    // This prevents duplicate groups even under high concurrent traffic
    const result = await ErrorModel.findOneAndUpdate(
      { groupId },
      updateOperation,
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    const isNewError = result.occurrenceCount === 1;
    const wasResolved = result.status === 'resolved' && result.occurrenceCount > 1;

    // Handle regression (error reoccurred after being resolved)
    if (wasResolved) {
      // Reset status to unresolved
      await ErrorModel.findByIdAndUpdate(result._id, { status: 'unresolved' });
      result.status = 'unresolved';

      // Trigger alert for regression
      await AlertService.createAlert({
        title: `Error Regression: ${input.message.slice(0, 50)}`,
        message: `A previously resolved error has reoccurred in ${input.service}`,
        type: 'new_error',
        severity: input.level === 'error' ? 'high' : 'medium',
        service: input.service,
        environment: input.environment,
        errorGroupId: groupId,
      });
    }

    // Trigger alert for new error
    if (isNewError) {
      await AlertService.createAlert({
        title: `New Error: ${input.message.slice(0, 50)}`,
        message: `A new error was detected in ${input.service}: ${input.message}`,
        type: 'new_error',
        severity: input.level === 'error' ? 'high' : input.level === 'warning' ? 'medium' : 'low',
        service: input.service,
        environment: input.environment,
        errorGroupId: groupId,
      });

      // Emit real-time event for new error
      emitNewError({
        id: result._id.toString(),
        groupId: result.groupId,
        message: result.message,
        service: result.service,
        environment: result.environment,
        level: result.level,
        occurrenceCount: result.occurrenceCount,
      });
    } else {
      // Emit real-time event for error count update
      emitErrorUpdated({
        id: result._id.toString(),
        groupId: result.groupId,
        occurrenceCount: result.occurrenceCount,
        service: result.service,
      });
    }

    return result;
  }

  /**
   * Get paginated list of grouped errors
   */
  static async getGroupedErrors(
    params: ErrorQueryParams
  ): Promise<PaginatedResult<GroupedError>> {
    const {
      service,
      environment,
      level,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = 'lastSeen',
      sortOrder = 'desc',
    } = params;

    // Build filter query
    const filter: Record<string, unknown> = {};

    if (service) filter.service = service;
    if (environment) filter.environment = environment;
    if (level) filter.level = level;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.lastSeen = {};
      if (startDate) (filter.lastSeen as Record<string, Date>).$gte = startDate;
      if (endDate) (filter.lastSeen as Record<string, Date>).$lte = endDate;
    }

    if (search) {
      filter.$or = [
        { message: { $regex: search, $options: 'i' } },
        { service: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Get total count
    const total = await ErrorModel.countDocuments(filter);

    // Build sort object
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Execute query with pagination
    const errors = await ErrorModel.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('groupId message service environment level status occurrenceCount firstSeen lastSeen tags')
      .lean();

    const totalPages = Math.ceil(total / limit);

    return {
      data: errors as unknown as GroupedError[],
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
   * Get detailed error by ID or groupId
   */
  static async getErrorById(id: string): Promise<IError | null> {
    // Try to find by MongoDB _id first, then by groupId
    let error = await ErrorModel.findById(id);
    
    if (!error) {
      error = await ErrorModel.findOne({ groupId: id });
    }

    return error;
  }

  /**
   * Update error status
   */
  static async updateErrorStatus(
    id: string,
    status: 'unresolved' | 'resolved' | 'ignored',
    assignedTo?: string
  ): Promise<IError | null> {
    const update: Record<string, unknown> = { status };
    if (assignedTo !== undefined) update.assignedTo = assignedTo;

    let error = await ErrorModel.findByIdAndUpdate(id, update, { new: true });
    
    if (!error) {
      error = await ErrorModel.findOneAndUpdate({ groupId: id }, update, { new: true });
    }

    // Emit real-time event for status change
    if (error) {
      emitErrorUpdated({
        id: error._id.toString(),
        groupId: error.groupId,
        status: error.status,
        service: error.service,
      });
    }

    return error;
  }

  /**
   * Get error statistics for dashboard
   */
  static async getErrorStats(service?: string, environment?: string) {
    const filter: Record<string, string> = {};
    if (service) filter.service = service;
    if (environment) filter.environment = environment;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalErrors,
      unresolvedErrors,
      errorsLast24h,
      errorsLast7d,
      errorsByLevel,
      errorsByService,
    ] = await Promise.all([
      ErrorModel.countDocuments(filter),
      ErrorModel.countDocuments({ ...filter, status: 'unresolved' }),
      ErrorModel.countDocuments({ ...filter, lastSeen: { $gte: last24h } }),
      ErrorModel.countDocuments({ ...filter, lastSeen: { $gte: last7d } }),
      ErrorModel.aggregate([
        { $match: filter },
        { $group: { _id: '$level', count: { $sum: 1 } } },
      ]),
      ErrorModel.aggregate([
        { $match: filter },
        { $group: { _id: '$service', count: { $sum: 1 }, totalOccurrences: { $sum: '$occurrenceCount' } } },
        { $sort: { totalOccurrences: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return {
      totalErrors,
      unresolvedErrors,
      errorsLast24h,
      errorsLast7d,
      errorsByLevel: errorsByLevel.reduce(
        (acc, item) => ({ ...acc, [item._id]: item.count }),
        {}
      ),
      errorsByService,
    };
  }

  /**
   * Get error occurrence timeline for charts
   */
  static async getErrorTimeline(
    groupId?: string,
    hours: number = 24,
    interval: number = 1
  ) {
    const now = new Date();
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const match: Record<string, unknown> = {
      lastSeen: { $gte: startTime },
    };

    if (groupId) {
      match.groupId = groupId;
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: '$lastSeen',
              unit: 'hour',
              binSize: interval,
            },
          },
          count: { $sum: '$occurrenceCount' },
          uniqueErrors: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 as const } },
    ];

    const timeline = await ErrorModel.aggregate(pipeline);

    return timeline.map((item) => ({
      timestamp: item._id,
      count: item.count,
      uniqueErrors: item.uniqueErrors,
    }));
  }
}
