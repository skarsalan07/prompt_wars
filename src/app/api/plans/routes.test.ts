import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OWNER_COOKIE_NAME, signOwnerId } from "@/lib/server/cookies";
import { buildPlanResult, createPlanSummary } from "@/lib/server/plan-service";
import { createInMemoryRepositories, type Repositories } from "@/lib/server/repositories";
import type { LLMPlanner } from "@/lib/server/groq";
import type { AIPlanPayload } from "@/lib/cooking-assistant/schemas";
import { normalizeCookingPlanRequest } from "@/lib/cooking-assistant/normalization";

let repositories: Repositories;
let planner: LLMPlanner;

vi.mock("@/lib/server/dependencies", () => ({
  getRepositories: () => repositories,
  getLLMPlanner: () => planner,
}));

const seededAIPlan: AIPlanPayload = {
  meals: [
    {
      slot: "breakfast",
      recipeName: "Tofu Scramble Toast",
      summary: "Savory tofu scramble on toast.",
      estimatedPreparationTimeMinutes: 12,
      calories: 330,
      macros: { proteinGrams: 20, carbsGrams: 24, fatGrams: 15 },
      ingredients: [
        { name: "Tofu", quantity: 4, unit: "ounce", note: "", optional: false },
        { name: "Whole Wheat Bread", quantity: 2, unit: "slice", note: "", optional: false },
        { name: "Tomato", quantity: 1, unit: "piece", note: "", optional: false },
      ],
      preparationSteps: ["Cook tofu.", "Toast bread and serve."],
      suggestedSubstitutions: [],
    },
    {
      slot: "lunch",
      recipeName: "Lentil Bowl",
      summary: "Lentils with greens and rice.",
      estimatedPreparationTimeMinutes: 20,
      calories: 510,
      macros: { proteinGrams: 25, carbsGrams: 60, fatGrams: 11 },
      ingredients: [
        { name: "Lentils", quantity: 2, unit: "cup", note: "", optional: false },
        { name: "Rice", quantity: 2, unit: "cup", note: "", optional: false },
        { name: "Spinach", quantity: 2, unit: "cup", note: "", optional: false },
      ],
      preparationSteps: ["Cook lentils.", "Serve over rice."],
      suggestedSubstitutions: [],
    },
    {
      slot: "dinner",
      recipeName: "Paneer Peppers",
      summary: "Paneer with peppers in a fast skillet.",
      estimatedPreparationTimeMinutes: 18,
      calories: 480,
      macros: { proteinGrams: 28, carbsGrams: 18, fatGrams: 24 },
      ingredients: [
        { name: "Paneer", quantity: 6, unit: "ounce", note: "", optional: false },
        { name: "Bell Pepper", quantity: 1, unit: "piece", note: "", optional: false },
        { name: "Spinach", quantity: 1, unit: "cup", note: "", optional: false },
      ],
      preparationSteps: ["Cook paneer.", "Add peppers and spinach."],
      suggestedSubstitutions: [{ from: "Paneer", to: "Tofu", reason: "Tofu lowers cost while keeping the same cooking flow." }],
    },
  ],
};

describe("GET /api/preferences and /api/plans/[id]", () => {
  beforeEach(async () => {
    process.env.COOKIE_SIGNING_SECRET = "test-cookie-secret";
    process.env.GROQ_API_KEY = "test-key";
    process.env.GROQ_MODEL = "llama-3.3-70b-versatile";
    repositories = createInMemoryRepositories();
    planner = {
      generate: vi.fn().mockResolvedValue(seededAIPlan),
    };

    const input = normalizeCookingPlanRequest({
      availableCookingTimeMinutes: 35,
      dailyBudgetUsd: 18,
      peopleCount: 2,
      dietaryPreference: "Vegetarian",
      existingIngredients: ["rice"],
      cookingSkillLevel: "Beginner",
    });

    const result = buildPlanResult(seededAIPlan, input);
    const summary = createPlanSummary(result);
    await repositories.profiles.upsertLatest("owner-a", result.inputSnapshot);
    await repositories.plans.create("owner-a", result, summary);
  });

  it("returns saved preferences for the signed owner", async () => {
    const { GET } = await import("@/app/api/preferences/route");
    const ownerCookie = signOwnerId("owner-a", "test-cookie-secret");

    const request = new NextRequest("http://localhost/api/preferences", {
      headers: {
        cookie: `${OWNER_COOKIE_NAME}=${ownerCookie}`,
      },
    });

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.dietaryPreference).toBe("Vegetarian");
  });

  it("prevents plan access across owners", async () => {
    const summaries = await repositories.plans.listByOwnerId("owner-a");
    const { GET } = await import("@/app/api/plans/[id]/route");
    const ownerCookie = signOwnerId("owner-b", "test-cookie-secret");

    const request = new NextRequest(`http://localhost/api/plans/${summaries[0].id}`, {
      headers: {
        cookie: `${OWNER_COOKIE_NAME}=${ownerCookie}`,
      },
    });

    const response = await GET(request, {
      params: Promise.resolve({ id: summaries[0].id }),
    });
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("PLAN_NOT_FOUND");
  });
});
