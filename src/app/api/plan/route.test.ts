import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OWNER_COOKIE_NAME, signOwnerId } from "@/lib/server/cookies";
import { createInMemoryRepositories, type Repositories } from "@/lib/server/repositories";
import type { LLMPlanner } from "@/lib/server/groq";
import type { AIPlanPayload } from "@/lib/cooking-assistant/schemas";

let repositories: Repositories;
let planner: LLMPlanner;

vi.mock("@/lib/server/dependencies", () => ({
  getRepositories: () => repositories,
  getLLMPlanner: () => planner,
}));

const sampleAIPlan: AIPlanPayload = {
  meals: [
    {
      slot: "breakfast",
      recipeName: "Berry Oats",
      summary: "Quick oats with fruit and yogurt.",
      estimatedPreparationTimeMinutes: 10,
      calories: 320,
      macros: { proteinGrams: 18, carbsGrams: 42, fatGrams: 8 },
      ingredients: [
        { name: "Rolled Oats", quantity: 1, unit: "cup", note: "", optional: false },
        { name: "Milk", quantity: 1, unit: "cup", note: "", optional: false },
        { name: "Banana", quantity: 1, unit: "piece", note: "", optional: false },
      ],
      preparationSteps: ["Cook oats in milk.", "Top with banana."],
      suggestedSubstitutions: [{ from: "Milk", to: "Soy Milk", reason: "Keeps breakfast dairy-free if needed." }],
    },
    {
      slot: "lunch",
      recipeName: "Chickpea Rice Bowl",
      summary: "Chickpeas and vegetables over rice.",
      estimatedPreparationTimeMinutes: 20,
      calories: 540,
      macros: { proteinGrams: 26, carbsGrams: 65, fatGrams: 14 },
      ingredients: [
        { name: "Chickpeas", quantity: 2, unit: "cup", note: "", optional: false },
        { name: "Rice", quantity: 2, unit: "cup", note: "", optional: false },
        { name: "Spinach", quantity: 2, unit: "cup", note: "", optional: false },
      ],
      preparationSteps: ["Warm chickpeas.", "Serve over rice with spinach."],
      suggestedSubstitutions: [],
    },
    {
      slot: "dinner",
      recipeName: "Tofu Stir-Fry",
      summary: "Tofu and vegetables in a fast skillet dinner.",
      estimatedPreparationTimeMinutes: 25,
      calories: 500,
      macros: { proteinGrams: 30, carbsGrams: 24, fatGrams: 22 },
      ingredients: [
        { name: "Tofu", quantity: 8, unit: "ounce", note: "", optional: false },
        { name: "Broccoli", quantity: 2, unit: "cup", note: "", optional: false },
        { name: "Bell Pepper", quantity: 1, unit: "piece", note: "", optional: false },
      ],
      preparationSteps: ["Brown tofu.", "Cook vegetables and combine."],
      suggestedSubstitutions: [],
    },
  ],
};

describe("POST /api/plan", () => {
  beforeEach(() => {
    process.env.COOKIE_SIGNING_SECRET = "test-cookie-secret";
    repositories = createInMemoryRepositories();
    planner = {
      generate: vi.fn().mockResolvedValue(sampleAIPlan),
    };
  });

  it("generates a plan, persists it, and sets the anonymous owner cookie", async () => {
    const { POST } = await import("@/app/api/plan/route");

    const request = new NextRequest("http://localhost/api/plan", {
      method: "POST",
      body: JSON.stringify({
        availableCookingTimeMinutes: 25,
        dailyBudgetUsd: 16,
        peopleCount: 2,
        dietaryPreference: "Vegetarian",
        existingIngredients: ["rice", "spinach"],
        cookingSkillLevel: "Beginner",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.data.meals.breakfast.recipeName).toBe("Berry Oats");
    expect(response.cookies.get(OWNER_COOKIE_NAME)?.value).toBeTruthy();
  });

  it("returns validation errors for invalid payloads", async () => {
    const { POST } = await import("@/app/api/plan/route");

    const request = new NextRequest("http://localhost/api/plan", {
      method: "POST",
      body: JSON.stringify({
        availableCookingTimeMinutes: 1,
        dailyBudgetUsd: -1,
        peopleCount: 0,
        dietaryPreference: "Vegetarian",
        existingIngredients: ["rice"],
        cookingSkillLevel: "Beginner",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
  });

  it("reuses the signed session owner when the cookie is present", async () => {
    const { POST } = await import("@/app/api/plan/route");
    const ownerCookie = signOwnerId("owner-1", "test-cookie-secret");

    const request = new NextRequest("http://localhost/api/plan", {
      method: "POST",
      body: JSON.stringify({
        availableCookingTimeMinutes: 30,
        dailyBudgetUsd: 22,
        peopleCount: 4,
        dietaryPreference: "High Protein",
        existingIngredients: [],
        cookingSkillLevel: "Intermediate",
      }),
      headers: {
        "content-type": "application/json",
        cookie: `${OWNER_COOKIE_NAME}=${ownerCookie}`,
      },
    });

    const response = await POST(request);
    const plans = await repositories.plans.listByOwnerId("owner-1");

    expect(response.status).toBe(201);
    expect(plans).toHaveLength(1);
    expect(response.cookies.get(OWNER_COOKIE_NAME)).toBeUndefined();
  });
});
