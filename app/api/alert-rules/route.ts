import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/api/db/connection";
import { AlertRuleModel } from "@/lib/api/models/alert-rule.model";
import {
  createErrorResponse,
  createSuccessResponse,
  parseQueryParams,
} from "@/lib/api/utils/validation";

/**
 * GET /api/alert-rules
 * List all alert rules
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const params = parseQueryParams(searchParams);
    const page = typeof params.page === "number" ? params.page : 1;
    const limit = typeof params.limit === "number" ? params.limit : 20;
    const enabledOnly = searchParams.get("enabled") === "true";

    const filter = enabledOnly ? { enabled: true } : {};

    const total = await AlertRuleModel.countDocuments(filter);
    const rules = await AlertRuleModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);

    return createSuccessResponse({
      data: rules,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching alert rules:", error);
    return createErrorResponse(
      "Internal server error",
      500,
      process.env.NODE_ENV === "development" ? String(error) : undefined,
    );
  }
}

/**
 * POST /api/alert-rules
 * Create a new alert rule
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();

    // Validate required fields
    const requiredFields = ["name", "type", "alertSeverity"];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return createErrorResponse(
        "Missing required fields",
        400,
        missingFields.map((field) => ({
          field,
          message: `${field} is required`,
        })),
      );
    }

    // Validate rule type
    const validTypes = [
      "threshold",
      "new_error",
      "error_spike",
      "service_down",
    ];
    if (!validTypes.includes(body.type)) {
      return createErrorResponse("Invalid rule type", 400);
    }

    // Validate threshold config for threshold rules
    if (body.type === "threshold") {
      if (!body.threshold?.count || !body.threshold?.windowMinutes) {
        return createErrorResponse(
          "Threshold rules require threshold.count and threshold.windowMinutes",
          400,
        );
      }
    }

    // Validate spike config for spike rules
    if (body.type === "error_spike") {
      if (!body.spikeConfig?.multiplier || !body.spikeConfig?.baselineMinutes) {
        return createErrorResponse(
          "Spike rules require spikeConfig.multiplier and spikeConfig.baselineMinutes",
          400,
        );
      }
    }

    const rule = new AlertRuleModel({
      ...body,
      createdBy: body.createdBy || "system",
      filters: body.filters || {},
    });

    await rule.save();

    return createSuccessResponse(rule, 201);
  } catch (error) {
    console.error("Error creating alert rule:", error);

    // Handle duplicate key error
    if ((error as { code?: number }).code === 11000) {
      return createErrorResponse("A rule with this name already exists", 409);
    }

    return createErrorResponse(
      "Internal server error",
      500,
      process.env.NODE_ENV === "development" ? String(error) : undefined,
    );
  }
}
