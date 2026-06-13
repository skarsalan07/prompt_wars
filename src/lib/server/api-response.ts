import { NextResponse } from "next/server";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

import type { AppErrorShape } from "@/lib/cooking-assistant/types";
import { applyOwnerCookie, type OwnerContext } from "@/lib/server/cookies";
import { AppError, isAppError } from "@/lib/server/errors";

export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
}

export interface ApiErrorResponse {
  ok: false;
  error: AppErrorShape;
}

export function jsonSuccess<T>(data: T, ownerContext?: OwnerContext, status = 200): NextResponse<ApiSuccessResponse<T>> {
  const response = NextResponse.json<ApiSuccessResponse<T>>({ ok: true, data }, { status });
  if (ownerContext) {
    applyOwnerCookie(response, ownerContext);
  }

  return response;
}

export function jsonError(error: unknown, ownerContext?: OwnerContext): NextResponse<ApiErrorResponse> {
  const normalizedError = normalizeError(error);
  const response = NextResponse.json<ApiErrorResponse>(
    {
      ok: false,
      error: normalizedError,
    },
    { status: normalizedError.status },
  );

  if (ownerContext) {
    applyOwnerCookie(response, ownerContext);
  }

  return response;
}

export function normalizeError(error: unknown): AppErrorShape {
  if (error instanceof z.ZodError) {
    const flattened = z.flattenError(error);
    return {
      code: "VALIDATION_ERROR",
      message: fromZodError(error).message,
      status: 400,
      details: flattened.fieldErrors,
    };
  }

  if (isAppError(error)) {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      code: "INTERNAL_SERVER_ERROR",
      message: error.message || "Unexpected server error.",
      status: 500,
    };
  }

  return {
    code: "INTERNAL_SERVER_ERROR",
    message: "Unexpected server error.",
    status: 500,
  };
}

export function assertPresent<T>(value: T | null | undefined, shape: AppErrorShape): T {
  if (value === null || value === undefined) {
    throw new AppError(shape);
  }

  return value;
}
