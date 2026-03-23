import { NextRequest } from "next/server";
import { clearAuthResponse } from "@/lib/api/middleware/auth";

/**
 * POST /api/auth/logout
 * Clear authentication token
 */
export async function POST(request: NextRequest) {
  try {
    return clearAuthResponse({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return clearAuthResponse(
      { success: false, error: "Internal server error" },
      500,
    );
  }
}
