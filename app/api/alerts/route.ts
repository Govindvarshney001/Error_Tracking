import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/api/db/connection';
import { AlertService } from '@/lib/api/services/alert.service';
import {
  createErrorResponse,
  createSuccessResponse,
  parseQueryParams,
} from '@/lib/api/utils/validation';

/**
 * GET /api/alerts
 * List alerts with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const params = parseQueryParams(searchParams);

    const result = await AlertService.getAlerts(params);

    return createSuccessResponse(result);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}

/**
 * POST /api/alerts
 * Create a new alert manually
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'message', 'type', 'severity', 'service', 'environment'];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return createErrorResponse(
        'Missing required fields',
        400,
        missingFields.map((field) => ({ field, message: `${field} is required` }))
      );
    }

    // Validate enum values
    const validTypes = ['error_spike', 'new_error', 'threshold_breach', 'service_down'];
    const validSeverities = ['critical', 'high', 'medium', 'low'];
    const validEnvironments = ['production', 'staging', 'development', 'test'];

    if (!validTypes.includes(body.type)) {
      return createErrorResponse('Invalid alert type', 400);
    }
    if (!validSeverities.includes(body.severity)) {
      return createErrorResponse('Invalid severity level', 400);
    }
    if (!validEnvironments.includes(body.environment)) {
      return createErrorResponse('Invalid environment', 400);
    }

    const alert = await AlertService.createAlert(body);

    return createSuccessResponse(alert, 201);
  } catch (error) {
    console.error('Error creating alert:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}
