import type { AppErrorShape } from "@/lib/cooking-assistant/types";

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, string[]>;

  constructor({ code, message, status, details }: AppErrorShape) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
