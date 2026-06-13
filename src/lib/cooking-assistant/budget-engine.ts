import {
  estimateIngredientCost,
  findSubstitutionOptions,
  getCatalogIngredient,
  getIngredientDisplayName,
  getPremiumIngredients,
  roundCurrency,
} from "@/lib/cooking-assistant/catalog";
import type {
  BudgetAdjustment,
  BudgetAnalysis,
  BudgetStatus,
  DietaryPreference,
  GroceryItem,
  IngredientLine,
  MealPlan,
  QuantityUnit,
  Substitution,
} from "@/lib/cooking-assistant/types";

export function consolidateGroceryItems(meals: MealPlan[]): GroceryItem[] {
  const accumulator = new Map<string, GroceryItem>();

  for (const meal of meals) {
    for (const ingredient of meal.ingredients) {
      const key = `${ingredient.canonicalName}:${ingredient.unit}:${ingredient.pantryCovered}`;
      const existing = accumulator.get(key);
      if (existing) {
        existing.quantity = roundCurrency(existing.quantity + ingredient.quantity);
        existing.estimatedCostUsd = roundCurrency(existing.estimatedCostUsd + ingredient.estimatedCostUsd);
      } else {
        accumulator.set(key, {
          name: ingredient.name,
          canonicalName: ingredient.canonicalName,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          estimatedCostUsd: ingredient.estimatedCostUsd,
          category: getCatalogIngredient(ingredient.canonicalName)?.category ?? "misc",
          pantryCovered: ingredient.pantryCovered,
        });
      }
    }
  }

  return Array.from(accumulator.values())
    .filter((item) => !item.pantryCovered)
    .sort((left, right) => right.estimatedCostUsd - left.estimatedCostUsd);
}

export function estimateMealIngredient(
  ingredient: Pick<IngredientLine, "canonicalName" | "quantity" | "unit">,
  pantrySet: Set<string>,
): Pick<IngredientLine, "estimatedCostUsd" | "pantryCovered"> {
  const pantryCovered = pantrySet.has(ingredient.canonicalName);
  return {
    pantryCovered,
    estimatedCostUsd: pantryCovered ? 0 : estimateIngredientCost(ingredient.canonicalName, ingredient.quantity, ingredient.unit),
  };
}

export function calculateMealCost(ingredients: Array<Pick<IngredientLine, "estimatedCostUsd">>): number {
  return roundCurrency(ingredients.reduce((sum, ingredient) => sum + ingredient.estimatedCostUsd, 0));
}

export function buildBudgetAnalysis(
  groceryList: GroceryItem[],
  dailyBudgetUsd: number,
  dietaryPreference: DietaryPreference,
): BudgetAnalysis {
  const totalEstimatedCostUsd = roundCurrency(groceryList.reduce((sum, item) => sum + item.estimatedCostUsd, 0));
  const status = classifyBudgetStatus(totalEstimatedCostUsd, dailyBudgetUsd);
  const adjustments = suggestBudgetAdjustments(groceryList, dietaryPreference, dailyBudgetUsd);
  const optimizedTotalCostUsd = roundCurrency(
    Math.max(0, totalEstimatedCostUsd - adjustments.reduce((sum, adjustment) => sum + adjustment.savingsUsd, 0)),
  );
  const optimizedStatus = classifyBudgetStatus(optimizedTotalCostUsd, dailyBudgetUsd);
  const varianceUsd = roundCurrency(totalEstimatedCostUsd - dailyBudgetUsd);

  return {
    status,
    optimizedStatus,
    dailyBudgetUsd,
    totalEstimatedCostUsd,
    optimizedTotalCostUsd,
    varianceUsd,
    explanation: createBudgetExplanation(status, optimizedStatus, totalEstimatedCostUsd, optimizedTotalCostUsd, dailyBudgetUsd, adjustments),
    savingsSuggestions: adjustments.map((adjustment) => adjustment.alternative ? `Swap ${adjustment.ingredient} for ${adjustment.alternative} to save $${adjustment.savingsUsd.toFixed(2)}.` : `Skip ${adjustment.ingredient} to save $${adjustment.savingsUsd.toFixed(2)}.`),
    adjustments,
  };
}

export function collectPlanSubstitutions(groceryList: GroceryItem[], dietaryPreference: DietaryPreference): Substitution[] {
  const substitutions = new Map<string, Substitution>();

  for (const item of groceryList) {
    for (const substitution of findSubstitutionOptions(item.canonicalName, dietaryPreference)) {
      const key = `${substitution.from}:${substitution.to}`;
      if (!substitutions.has(key)) {
        substitutions.set(key, {
          from: substitution.from,
          to: substitution.to,
          reason: substitution.reason,
          estimatedSavingsUsd: substitution.estimatedSavingsUsd,
        });
      }
    }
  }

  return Array.from(substitutions.values()).sort((left, right) => left.from.localeCompare(right.from));
}

export function classifyBudgetStatus(totalCostUsd: number, dailyBudgetUsd: number): BudgetStatus {
  if (dailyBudgetUsd <= 0) {
    return totalCostUsd === 0 ? "Within Budget" : "Over Budget";
  }

  const usage = totalCostUsd / dailyBudgetUsd;
  if (usage <= 0.85) {
    return "Within Budget";
  }

  if (usage <= 1) {
    return "Near Limit";
  }

  return "Over Budget";
}

function suggestBudgetAdjustments(
  groceryList: GroceryItem[],
  dietaryPreference: DietaryPreference,
  dailyBudgetUsd: number,
): BudgetAdjustment[] {
  const totalEstimatedCostUsd = groceryList.reduce((sum, item) => sum + item.estimatedCostUsd, 0);
  if (classifyBudgetStatus(totalEstimatedCostUsd, dailyBudgetUsd) !== "Over Budget") {
    return [];
  }

  const adjustments: BudgetAdjustment[] = [];
  const premiumSet = new Set(getPremiumIngredients());

  for (const item of groceryList) {
    const options = findSubstitutionOptions(item.canonicalName, dietaryPreference);
    const bestOption = options
      .map((option) => {
        const alternativeCost = estimateReplacementCost(item.quantity, item.unit, option.canonicalTo);
        return { option, alternativeCost };
      })
      .filter((candidate) => candidate.alternativeCost < item.estimatedCostUsd)
      .sort((left, right) => left.alternativeCost - right.alternativeCost)[0];

    if (bestOption) {
      adjustments.push({
        action: "swap",
        ingredient: item.name,
        alternative: bestOption.option.to,
        originalCostUsd: item.estimatedCostUsd,
        optimizedCostUsd: bestOption.alternativeCost,
        savingsUsd: roundCurrency(item.estimatedCostUsd - bestOption.alternativeCost),
        reason: bestOption.option.reason,
      });
      continue;
    }

    if (premiumSet.has(item.canonicalName)) {
      adjustments.push({
        action: "remove",
        ingredient: item.name,
        originalCostUsd: item.estimatedCostUsd,
        optimizedCostUsd: 0,
        savingsUsd: item.estimatedCostUsd,
        reason: `${getIngredientDisplayName(item.canonicalName)} is a premium ingredient and can be skipped if you need to cut cost quickly.`,
      });
    }
  }

  return adjustments.slice(0, 4);
}

function estimateReplacementCost(quantity: number, unit: QuantityUnit, replacementCanonicalName: string): number {
  return estimateIngredientCost(replacementCanonicalName, quantity, unit);
}

function createBudgetExplanation(
  status: BudgetStatus,
  optimizedStatus: BudgetStatus,
  totalEstimatedCostUsd: number,
  optimizedTotalCostUsd: number,
  dailyBudgetUsd: number,
  adjustments: BudgetAdjustment[],
): string {
  if (status === "Within Budget") {
    return `The grocery plan lands at $${totalEstimatedCostUsd.toFixed(2)}, which stays comfortably inside the $${dailyBudgetUsd.toFixed(2)} budget.`;
  }

  if (status === "Near Limit") {
    return `The plan totals $${totalEstimatedCostUsd.toFixed(2)}, so it is workable but close to the $${dailyBudgetUsd.toFixed(2)} limit.`;
  }

  if (adjustments.length === 0) {
    return `The current grocery estimate is $${totalEstimatedCostUsd.toFixed(2)}, which is above the $${dailyBudgetUsd.toFixed(2)} budget. Try removing premium items or simplifying protein choices.`;
  }

  return `The current grocery estimate is $${totalEstimatedCostUsd.toFixed(2)}, above the $${dailyBudgetUsd.toFixed(2)} budget. The suggested swaps trim the plan to about $${optimizedTotalCostUsd.toFixed(2)}, moving it to ${optimizedStatus.toLowerCase()}.`;
}
