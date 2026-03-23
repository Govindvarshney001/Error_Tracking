import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/api/db/connection';
import { ErrorService } from '@/lib/api/services/error.service';
import { createErrorResponse, createSuccessResponse } from '@/lib/api/utils/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/errors/:id
 * Get detailed error by ID or groupId
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();

    const { id } = await params;

    if (!id) {
      return createErrorResponse('Error ID is required', 400);
    }

    const error = await ErrorService.getErrorById(id);

    if (!error) {
      return createErrorResponse('Error not found', 404);
    }

    return createSuccessResponse(error);
  } catch (error) {
    console.error('Error fetching error detail:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}

/**
 * PATCH /api/errors/:id
 * Update error status
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();

    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return createErrorResponse('Error ID is required', 400);
    }

    const { status, assignedTo } = body;

    if (status && !['unresolved', 'resolved', 'ignored'].includes(status)) {
      return createErrorResponse(
        'Invalid status. Must be one of: unresolved, resolved, ignored',
        400
      );
    }

    const error = await ErrorService.updateErrorStatus(id, status, assignedTo);

    if (!error) {
      return createErrorResponse('Error not found', 404);
    }

    return createSuccessResponse(error);
  } catch (error) {
    console.error('Error updating error:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}
