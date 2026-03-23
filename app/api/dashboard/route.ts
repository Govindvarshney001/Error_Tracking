import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/api/db/connection";
import { ErrorService } from "@/lib/api/services/error.service";
import { AlertService } from "@/lib/api/services/alert.service";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/utils/validation";

/**
 * GET /api/dashboard
 * Get all dashboard data including stats and recent errors/alerts
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const service = searchParams.get("service") || undefined;
    const environment = searchParams.get("environment") || undefined;

    // Get error stats
    const stats = await ErrorService.getErrorStats(service, environment);

    // Get recent errors
    const errors = await ErrorService.getGroupedErrors({
      page: 1,
      limit: 10,
      sortBy: "lastSeen",
      sortOrder: "desc",
    });

    // Get active alerts
    const alerts = await AlertService.getAlerts({
      page: 1,
      limit: 10,
    });

    // Get timeline for charts (last 12 hours)
    const timeline = await ErrorService.getErrorTimeline(undefined, 12, 1);

    return createSuccessResponse({
      stats: {
        totalErrors24h: stats.errorsLast24h || 0,
        totalErrors7d: stats.errorsLast7d || 0,
        affectedUsers: stats.totalErrors || 0, // Using total unique errors as proxy
        activeAlerts:
          alerts.data.filter((a: { status: string }) => a.status === "active")
            .length || 0,
        resolvedAlerts:
          alerts.data.filter((a: { status: string }) => a.status === "resolved")
            .length || 0,
        errorRateChange: 0, // Would need historical data to calculate
      },
      recentErrors: errors.data,
      recentAlerts: alerts.data,
      timeline,
      errorsByService: stats.errorsByService || [],
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return createErrorResponse(
      "Internal server error",
      500,
      process.env.NODE_ENV === "development" ? String(error) : undefined,
    );
  }
}
