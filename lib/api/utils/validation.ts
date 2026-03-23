import { NextResponse } from "next/server";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateErrorPayload(payload: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!payload || typeof payload !== "object") {
    return {
      valid: false,
      errors: [{ field: "body", message: "Request body is required" }],
    };
  }

  const data = payload as Record<string, unknown>;

  // Required fields
  if (!data.message || typeof data.message !== "string") {
    errors.push({
      field: "message",
      message: "Message is required and must be a string",
    });
  } else if (data.message.length > 5000) {
    errors.push({
      field: "message",
      message: "Message must be less than 5000 characters",
    });
  }

  if (!data.stack || typeof data.stack !== "string") {
    errors.push({
      field: "stack",
      message: "Stack trace is required and must be a string",
    });
  } else if (data.stack.length > 50000) {
    errors.push({
      field: "stack",
      message: "Stack trace must be less than 50000 characters",
    });
  }

  if (!data.service || typeof data.service !== "string") {
    errors.push({
      field: "service",
      message: "Service name is required and must be a string",
    });
  } else if (data.service.length > 100) {
    errors.push({
      field: "service",
      message: "Service name must be less than 100 characters",
    });
  }

  if (!data.environment || typeof data.environment !== "string") {
    errors.push({
      field: "environment",
      message: "Environment is required and must be a string",
    });
  } else if (
    !["production", "staging", "development", "test"].includes(data.environment)
  ) {
    errors.push({
      field: "environment",
      message:
        "Environment must be one of: production, staging, development, test",
    });
  }

  // Optional fields
  if (data.level !== undefined) {
    if (!["error", "warning", "info"].includes(data.level as string)) {
      errors.push({
        field: "level",
        message: "Level must be one of: error, warning, info",
      });
    }
  }

  if (data.timestamp !== undefined) {
    if (typeof data.timestamp !== "number" || isNaN(data.timestamp)) {
      errors.push({
        field: "timestamp",
        message: "Timestamp must be a valid number (Unix timestamp)",
      });
    }
  }

  if (data.metadata !== undefined) {
    if (typeof data.metadata !== "object" || Array.isArray(data.metadata)) {
      errors.push({ field: "metadata", message: "Metadata must be an object" });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function createErrorResponse(
  message: string,
  status: number,
  details?: unknown,
): NextResponse {
  const response: Record<string, unknown> = {
    success: false,
    error: {
      message,
    },
  };

  if (details !== undefined) {
    (response.error as Record<string, unknown>).details = details;
  }

  return NextResponse.json(response, { status });
}

export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status },
  );
}

export function parseQueryParams(
  searchParams: URLSearchParams,
): Record<string, string | number> {
  const params: Record<string, string | number> = {};

  const stringParams = [
    "service",
    "environment",
    "level",
    "status",
    "search",
    "sortBy",
    "sortOrder",
    "type",
    "severity",
  ];
  const numberParams = ["page", "limit"];

  stringParams.forEach((key) => {
    const value = searchParams.get(key);
    if (value) params[key] = value;
  });

  numberParams.forEach((key) => {
    const value = searchParams.get(key);
    if (value) {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) params[key] = num;
    }
  });

  // Parse dates
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  return params;
}
