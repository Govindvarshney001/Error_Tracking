import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/api/db/connection";
import { UserModel } from "@/lib/api/models/user.model";
import {
  generateToken,
  createAuthResponse,
  createErrorResponse,
} from "@/lib/api/middleware/auth";

/**
 * POST /api/auth/signup
 * Create a new user account
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { name, email, password } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return createErrorResponse(
        "Missing required fields: name, email, password",
        400,
      );
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse("Invalid email format", 400);
    }

    // Validate password length
    if (password.length < 6) {
      return createErrorResponse("Password must be at least 6 characters", 400);
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      return createErrorResponse("Email already registered", 400);
    }

    // Create new user
    const user = await UserModel.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    // Generate token
    const token = generateToken(user);

    return createAuthResponse(
      {
        success: true,
        message: "User created successfully",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
        token,
      },
      201,
    );
  } catch (error) {
    console.error("Signup error:", error);
    return createErrorResponse(
      "Internal server error",
      500,
      process.env.NODE_ENV === "development" ? String(error) : undefined,
    );
  }
}
