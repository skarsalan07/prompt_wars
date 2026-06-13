import type { CookingPlanRequest, PlanResult, SavedPlanSummary } from "@/lib/cooking-assistant/types";

interface ApiSuccess<T> {
  ok: true;
  data: T;
}

interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export async function fetchPreferences(): Promise<CookingPlanRequest | null> {
  return request<CookingPlanRequest | null>("/api/preferences");
}

export async function fetchRecentPlans(): Promise<SavedPlanSummary[]> {
  return request<SavedPlanSummary[]>("/api/plans");
}

export async function fetchSavedPlan(id: string): Promise<PlanResult> {
  return request<PlanResult>(`/api/plans/${id}`);
}

export async function createCookingPlan(payload: CookingPlanRequest): Promise<PlanResult> {
  return request<PlanResult>("/api/plan", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!payload.ok) {
    const error = new Error(payload.error.message);
    error.name = payload.error.code;
    throw error;
  }

  return payload.data;
}
