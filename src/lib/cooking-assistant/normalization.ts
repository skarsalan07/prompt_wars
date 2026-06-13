import type { CookingPlanRequest, NormalizedCookingPlanRequest } from "@/lib/cooking-assistant/types";
import { DEFAULT_PANTRY_ITEMS, getIngredientDisplayName, normalizeIngredientName } from "@/lib/cooking-assistant/catalog";

export function normalizeCookingPlanRequest(input: CookingPlanRequest): NormalizedCookingPlanRequest {
  const normalizedIngredients = Array.from(
    new Set(
      [...input.existingIngredients, ...DEFAULT_PANTRY_ITEMS]
        .map((item) => normalizeIngredientName(item))
        .filter(Boolean),
    ),
  );

  const existingIngredients = normalizedIngredients.map((ingredient) => getIngredientDisplayName(ingredient));

  return {
    ...input,
    existingIngredients,
    normalizedIngredientSet: new Set(normalizedIngredients),
  };
}

export function serializeCookingPlanRequest(input: NormalizedCookingPlanRequest | CookingPlanRequest): CookingPlanRequest {
  return {
    availableCookingTimeMinutes: input.availableCookingTimeMinutes,
    dailyBudgetUsd: input.dailyBudgetUsd,
    peopleCount: input.peopleCount,
    dietaryPreference: input.dietaryPreference,
    existingIngredients: input.existingIngredients,
    cookingSkillLevel: input.cookingSkillLevel,
  };
}
