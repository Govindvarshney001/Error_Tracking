import { connectToDatabase } from '@/lib/api/db/connection';
import { AlertService } from '@/lib/api/services/alert.service';
import { createErrorResponse, createSuccessResponse } from '@/lib/api/utils/validation';

/**
 * GET /api/alerts/stats
 * Get alert statistics for dashboard
 */
export async function GET() {
  try {
    await connectToDatabase();

    const stats = await AlertService.getAlertStats();

    return createSuccessResponse(stats);
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}
