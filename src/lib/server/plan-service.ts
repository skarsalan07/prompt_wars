import { calculateMealCost, buildBudgetAnalysis, collectPlanSubstitutions, consolidateGroceryItems, estimateMealIngredient } from "@/lib/cooking-assistant/budget-engine";
import { getIngredientDisplayName, isIngredientAllowedForDiet, normalizeIngredientName, roundCurrency } from "@/lib/cooking-assistant/catalog";
import type { AIPlanPayload } from "@/lib/cooking-assistant/schemas";
import type {
  CookingPlanRequest,
  GroceryItem,
  MealPlan,
  MealSlot,
  NormalizedCookingPlanRequest,
  PlanResult,
  SavedPlanSummary,
  Substitution,
} from "@/lib/cooking-assistant/types";
import { cookingPlanRequestSchema } from "@/lib/cooking-assistant/schemas";
import { normalizeCookingPlanRequest, serializeCookingPlanRequest } from "@/lib/cooking-assistant/normalization";
import { MODEL_MAX_OUTPUT_TOKENS, MODEL_TEMPERATURE, PROMPT_VERSION, RESPONSE_SCHEMA_VERSION } from "@/lib/server/prompt-builder";
import { getGroqEnv } from "@/lib/server/env";
import { AppError } from "@/lib/server/errors";
import type { LLMPlanner } from "@/lib/server/groq";
import type { Repositories } from "@/lib/server/repositories";

const RECENT_PLAN_LIMIT = 10;

export async function generateAndStoreCookingPlan(
  rawInput: CookingPlanRequest,
  ownerId: string,
  repositories: Repositories,
  planner: LLMPlanner,
): Promise<PlanResult> {
  const validatedInput = cookingPlanRequestSchema.parse(rawInput);
  const normalizedInput = normalizeCookingPlanRequest(validatedInput);
  const aiPlan = await planner.generate(normalizedInput);
  const result = buildPlanResult(aiPlan, normalizedInput);
  const summary = createPlanSummary(result);

  const storedPlan = await repositories.plans.create(ownerId, result, summary);
  await repositories.profiles.upsertLatest(ownerId, serializeCookingPlanRequest(normalizedInput));

  return {
    ...storedPlan.result,
    id: storedPlan.id,
  };
}

export async function listSavedPlans(ownerId: string, repositories: Repositories) {
  return repositories.plans.listByOwnerId(ownerId, RECENT_PLAN_LIMIT);
}

export async function getSavedPlanById(ownerId: string, id: string, repositories: Repositories): Promise<PlanResult> {
  const plan = await repositories.plans.getByIdForOwner(id, ownerId);
  if (!plan) {
    throw new AppError({
      code: "PLAN_NOT_FOUND",
      message: "No saved plan was found for this session.",
      status: 404,
    });
  }

  return plan.result;
}

export async function getSavedPreferences(ownerId: string, repositories: Repositories) {
  const profile = await repositories.profiles.getByOwnerId(ownerId);
  return profile?.latestPreferences ?? null;
}

export function buildPlanResult(aiPlan: AIPlanPayload, normalizedInput: NormalizedCookingPlanRequest): PlanResult {
  const env = getGroqEnv();
  const meals = createMeals(aiPlan, normalizedInput);
  const orderedMeals = [meals.breakfast, meals.lunch, meals.dinner];
  const groceryList = consolidateGroceryItems(orderedMeals);
  const substitutions = mergeSubstitutions(orderedMeals, collectPlanSubstitutions(groceryList, normalizedInput.dietaryPreference));
  const budgetAnalysis = buildBudgetAnalysis(groceryList, normalizedInput.dailyBudgetUsd, normalizedInput.dietaryPreference);

  return {
    id: "",
    createdAt: new Date().toISOString(),
    inputSnapshot: serializeCookingPlanRequest(normalizedInput),
    meals,
    groceryList,
    substitutions,
    budgetAnalysis,
    promptMetadata: {
      model: env.GROQ_MODEL,
      promptVersion: PROMPT_VERSION,
      responseSchemaVersion: RESPONSE_SCHEMA_VERSION,
      temperature: MODEL_TEMPERATURE,
      maxOutputTokens: MODEL_MAX_OUTPUT_TOKENS,
    },
  };
}

export function createPlanSummary(result: PlanResult): SavedPlanSummary {
  return {
    id: result.id,
    createdAt: result.createdAt,
    dietaryPreference: result.inputSnapshot.dietaryPreference,
    totalEstimatedCostUsd: result.budgetAnalysis.totalEstimatedCostUsd,
    budgetStatus: result.budgetAnalysis.status,
    headline: `${result.meals.breakfast.recipeName} · ${result.meals.lunch.recipeName} · ${result.meals.dinner.recipeName}`,
    mealNames: {
      breakfast: result.meals.breakfast.recipeName,
      lunch: result.meals.lunch.recipeName,
      dinner: result.meals.dinner.recipeName,
    },
  };
}

function createMeals(aiPlan: AIPlanPayload, normalizedInput: NormalizedCookingPlanRequest): Record<MealSlot, MealPlan> {
  const bySlot = {} as Record<MealSlot, MealPlan>;

  for (const meal of aiPlan.meals) {
    const ingredients = meal.ingredients.map((ingredient) => {
      const canonicalName = normalizeIngredientName(ingredient.name);
      if (!canonicalName) {
        throw new AppError({
          code: "MODEL_INVALID_INGREDIENT",
          message: "The language model returned an empty ingredient name.",
          status: 502,
        });
      }

      if (!isIngredientAllowedForDiet(canonicalName, normalizedInput.dietaryPreference)) {
        throw new AppError({
          code: "MODEL_DIET_MISMATCH",
          message: `The language model returned ${getIngredientDisplayName(canonicalName)}, which conflicts with the selected diet.`,
          status: 502,
        });
      }

      const costInfo = estimateMealIngredient(
        {
          canonicalName,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
        },
        normalizedInput.normalizedIngredientSet,
      );

      return {
        name: getIngredientDisplayName(canonicalName),
        canonicalName,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        note: ingredient.note || undefined,
        optional: ingredient.optional,
        pantryCovered: costInfo.pantryCovered,
        estimatedCostUsd: costInfo.estimatedCostUsd,
      };
    });

    const mealSubstitutions = meal.suggestedSubstitutions.reduce<Substitution[]>((accumulator, substitution) => {
        const fromCanonical = normalizeIngredientName(substitution.from);
        const toCanonical = normalizeIngredientName(substitution.to);
        if (!fromCanonical || !toCanonical || !isIngredientAllowedForDiet(toCanonical, normalizedInput.dietaryPreference)) {
          return accumulator;
        }

        accumulator.push({
          from: getIngredientDisplayName(fromCanonical),
          to: getIngredientDisplayName(toCanonical),
          reason: substitution.reason,
          estimatedSavingsUsd: roundCurrency(
            Math.max(
              0,
              ingredients.find((ingredient) => ingredient.canonicalName === fromCanonical)?.estimatedCostUsd ?? 0,
            ),
          ),
        });

        return accumulator;
    }, []);

    bySlot[meal.slot] = {
      slot: meal.slot,
      recipeName: meal.recipeName,
      summary: meal.summary,
      preparationSteps: meal.preparationSteps,
      estimatedPreparationTimeMinutes: meal.estimatedPreparationTimeMinutes,
      estimatedCostUsd: calculateMealCost(ingredients),
      calories: meal.calories,
      macros: meal.macros,
      ingredients,
      substitutions: mealSubstitutions,
    };
  }

  return bySlot;
}

function mergeSubstitutions(meals: MealPlan[], catalogSubstitutions: Substitution[]): Substitution[] {
  const accumulator = new Map<string, Substitution>();

  for (const meal of meals) {
    for (const substitution of meal.substitutions) {
      accumulator.set(`${substitution.from}:${substitution.to}`, substitution);
    }
  }

  for (const substitution of catalogSubstitutions) {
    accumulator.set(`${substitution.from}:${substitution.to}`, substitution);
  }

  return Array.from(accumulator.values()).sort((left, right) => left.from.localeCompare(right.from));
}
