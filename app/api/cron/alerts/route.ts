import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/api/db/connection';
import { AlertEngineService } from '@/lib/api/services/alert-engine.service';
import { createErrorResponse, createSuccessResponse } from '@/lib/api/utils/validation';

/**
 * GET /api/cron/alerts
 * Background job endpoint to run the alert engine
 * Should be called by a cron job (e.g., every minute)
 * 
 * Security: Validate CRON_SECRET in production
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret in production
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return createErrorResponse('Unauthorized', 401);
    }

    await connectToDatabase();

    // Run the alert engine
    const engineResult = await AlertEngineService.runAlertEngine();

    // Auto-resolve stale alerts
    const autoResolved = await AlertEngineService.autoResolveAlerts();

    return createSuccessResponse({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        ...engineResult,
        autoResolved,
      },
    });
  } catch (error) {
    console.error('Error running alert cron:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}

/**
 * POST /api/cron/alerts
 * Manual trigger for the alert engine (for testing)
 */
export async function POST(request: NextRequest) {
  try {
    // Only allow in development or with proper auth
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (process.env.NODE_ENV === 'production' && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return createErrorResponse('Unauthorized', 401);
    }

    await connectToDatabase();

    const engineResult = await AlertEngineService.runAlertEngine();
    const autoResolved = await AlertEngineService.autoResolveAlerts();

    return createSuccessResponse({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        ...engineResult,
        autoResolved,
      },
    });
  } catch (error) {
    console.error('Error running alert engine:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}
