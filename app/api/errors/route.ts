import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/api/db/connection';
import { ErrorService } from '@/lib/api/services/error.service';
import {
  validateErrorPayload,
  createErrorResponse,
  createSuccessResponse,
  parseQueryParams,
} from '@/lib/api/utils/validation';

/**
 * POST /api/errors
 * Ingest a new error
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();

    // Validate payload
    const validation = validateErrorPayload(body);
    if (!validation.valid) {
      return createErrorResponse('Validation failed', 400, validation.errors);
    }

    // Ingest the error
    const error = await ErrorService.ingestError({
      message: body.message,
      stack: body.stack,
      service: body.service,
      environment: body.environment,
      level: body.level,
      timestamp: body.timestamp,
      metadata: body.metadata,
      tags: body.tags,
    });

    return createSuccessResponse(
      {
        id: error._id,
        groupId: error.groupId,
        message: error.message,
        occurrenceCount: error.occurrenceCount,
        isNewError: error.occurrenceCount === 1,
      },
      201
    );
  } catch (error) {
    console.error('Error ingesting error:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}

/**
 * GET /api/errors
 * List grouped errors with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const params = parseQueryParams(searchParams);

    // Parse dates if provided
    const queryParams = {
      ...params,
      startDate: params.startDate ? new Date(params.startDate as string) : undefined,
      endDate: params.endDate ? new Date(params.endDate as string) : undefined,
    };

    const result = await ErrorService.getGroupedErrors(queryParams);

    return createSuccessResponse(result);
  } catch (error) {
    console.error('Error fetching errors:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}
