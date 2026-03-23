import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/api/db/connection";
import { UserModel, IUser } from "@/lib/api/models/user.model";
import { createErrorResponse } from "@/lib/api/utils/validation";

export { createErrorResponse };

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthRequest extends NextRequest {
  user?: AuthUser;
}

/**
 * Generate JWT token for user
 */
export function generateToken(user: IUser): string {
  return jwt.sign(
    { id: user._id.toString(), name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

/**
 * Verify JWT token and return user data
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Extract token from request
 */
function extractToken(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Check cookies
  const token = request.cookies.get("auth-token")?.value;
  if (token) {
    return token;
  }

  return null;
}

/**
 * Auth middleware - protects routes
 */
export async function authMiddleware(
  request: AuthRequest,
  handler: (request: AuthRequest) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    await connectToDatabase();

    const token = extractToken(request);

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // Attach user to request
    request.user = user;

    return handler(request);
  } catch (error) {
    console.error("Auth middleware error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Optional auth - doesn't require authentication but attaches user if token exists
 */
export async function optionalAuthMiddleware(
  request: AuthRequest,
  handler: (request: AuthRequest) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    await connectToDatabase();

    const token = extractToken(request);

    if (token) {
      const user = verifyToken(token);
      if (user) {
        request.user = user;
      }
    }

    return handler(request);
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    return handler(request);
  }
}

/**
 * Helper to create response with auth token in cookie
 */
export function createAuthResponse(
  data: unknown,
  status: number = 200,
): NextResponse {
  const response = NextResponse.json(data, { status });

  // Set HTTP-only cookie
  response.cookies.set("auth-token", (data as { token?: string }).token || "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
}

/**
 * Helper to clear auth cookie
 */
export function clearAuthResponse(
  data: unknown,
  status: number = 200,
): NextResponse {
  const response = NextResponse.json(data, { status });

  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
