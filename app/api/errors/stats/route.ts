import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/api/db/connection';
import { ErrorService } from '@/lib/api/services/error.service';
import { createErrorResponse, createSuccessResponse } from '@/lib/api/utils/validation';

/**
 * GET /api/errors/stats
 * Get error statistics for dashboard
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service') || undefined;
    const environment = searchParams.get('environment') || undefined;

    const stats = await ErrorService.getErrorStats(service, environment);

    return createSuccessResponse(stats);
  } catch (error) {
    console.error('Error fetching error stats:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}
