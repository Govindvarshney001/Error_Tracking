import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/api/db/connection';
import { ErrorService } from '@/lib/api/services/error.service';
import { createErrorResponse, createSuccessResponse } from '@/lib/api/utils/validation';

/**
 * GET /api/errors/timeline
 * Get error occurrence timeline for charts
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId') || undefined;
    const hours = parseInt(searchParams.get('hours') || '24', 10);
    const interval = parseInt(searchParams.get('interval') || '1', 10);

    // Validate parameters
    if (isNaN(hours) || hours < 1 || hours > 168) {
      return createErrorResponse('Hours must be between 1 and 168', 400);
    }

    if (isNaN(interval) || interval < 1 || interval > 24) {
      return createErrorResponse('Interval must be between 1 and 24', 400);
    }

    const timeline = await ErrorService.getErrorTimeline(groupId, hours, interval);

    return createSuccessResponse(timeline);
  } catch (error) {
    console.error('Error fetching error timeline:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}
