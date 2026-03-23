import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/api/db/connection";
import { UserModel } from "@/lib/api/models/user.model";
import {
  generateToken,
  createAuthResponse,
  createErrorResponse,
} from "@/lib/api/middleware/auth";

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return createErrorResponse(
        "Missing required fields: email, password",
        400,
      );
    }

    // Find user by email with password (explicitly select password)
    const user = await UserModel.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      return createErrorResponse("Invalid email or password", 401);
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return createErrorResponse("Invalid email or password", 401);
    }

    // Generate token
    const token = generateToken(user);

    return createAuthResponse({
      success: true,
      message: "Login successful",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return createErrorResponse(
      "Internal server error",
      500,
      process.env.NODE_ENV === "development" ? String(error) : undefined,
    );
  }
}
