import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/api/db/connection';
import { AlertService } from '@/lib/api/services/alert.service';
import { createErrorResponse, createSuccessResponse } from '@/lib/api/utils/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/alerts/:id
 * Get alert by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();

    const { id } = await params;

    if (!id) {
      return createErrorResponse('Alert ID is required', 400);
    }

    const alert = await AlertService.getAlertById(id);

    if (!alert) {
      return createErrorResponse('Alert not found', 404);
    }

    return createSuccessResponse(alert);
  } catch (error) {
    console.error('Error fetching alert:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}

/**
 * PATCH /api/alerts/:id
 * Update alert status (acknowledge or resolve)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();

    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return createErrorResponse('Alert ID is required', 400);
    }

    const { action, userId } = body;

    if (!action || !['acknowledge', 'resolve'].includes(action)) {
      return createErrorResponse('Action must be either "acknowledge" or "resolve"', 400);
    }

    let alert;
    if (action === 'acknowledge') {
      alert = await AlertService.acknowledgeAlert(id, userId || 'system');
    } else {
      alert = await AlertService.resolveAlert(id, userId || 'system');
    }

    if (!alert) {
      return createErrorResponse('Alert not found', 404);
    }

    return createSuccessResponse(alert);
  } catch (error) {
    console.error('Error updating alert:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}
