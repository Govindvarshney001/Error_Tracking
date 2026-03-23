import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/api/db/connection';
import { AlertRuleModel } from '@/lib/api/models/alert-rule.model';
import { createErrorResponse, createSuccessResponse } from '@/lib/api/utils/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/alert-rules/:id
 * Get alert rule by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();

    const { id } = await params;

    if (!id) {
      return createErrorResponse('Rule ID is required', 400);
    }

    const rule = await AlertRuleModel.findById(id);

    if (!rule) {
      return createErrorResponse('Alert rule not found', 404);
    }

    return createSuccessResponse(rule);
  } catch (error) {
    console.error('Error fetching alert rule:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}

/**
 * PATCH /api/alert-rules/:id
 * Update an alert rule
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();

    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return createErrorResponse('Rule ID is required', 400);
    }

    // Don't allow changing the rule type
    delete body.type;
    delete body.createdBy;
    delete body.createdAt;

    const rule = await AlertRuleModel.findByIdAndUpdate(
      id,
      {
        ...body,
        updatedBy: body.updatedBy || 'system',
      },
      { new: true, runValidators: true }
    );

    if (!rule) {
      return createErrorResponse('Alert rule not found', 404);
    }

    return createSuccessResponse(rule);
  } catch (error) {
    console.error('Error updating alert rule:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}

/**
 * DELETE /api/alert-rules/:id
 * Delete an alert rule
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();

    const { id } = await params;

    if (!id) {
      return createErrorResponse('Rule ID is required', 400);
    }

    const rule = await AlertRuleModel.findByIdAndDelete(id);

    if (!rule) {
      return createErrorResponse('Alert rule not found', 404);
    }

    return createSuccessResponse({ message: 'Alert rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert rule:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? String(error) : undefined
    );
  }
}
