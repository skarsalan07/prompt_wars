export const DIETARY_PREFERENCES = [
  "Vegetarian",
  "Vegan",
  "Non-Vegetarian",
  "Jain",
  "Keto",
  "High Protein",
] as const;

export const COOKING_SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

export const MEAL_SLOTS = ["breakfast", "lunch", "dinner"] as const;

export const QUANTITY_UNITS = [
  "piece",
  "slice",
  "clove",
  "cup",
  "tablespoon",
  "teaspoon",
  "ounce",
  "pound",
  "gram",
  "kilogram",
  "milliliter",
  "liter",
  "can",
] as const;

export const BUDGET_STATUSES = ["Within Budget", "Near Limit", "Over Budget"] as const;

export type DietaryPreference = (typeof DIETARY_PREFERENCES)[number];
export type CookingSkillLevel = (typeof COOKING_SKILL_LEVELS)[number];
export type MealSlot = (typeof MEAL_SLOTS)[number];
export type QuantityUnit = (typeof QUANTITY_UNITS)[number];
export type BudgetStatus = (typeof BUDGET_STATUSES)[number];

export interface CookingPlanRequest {
  availableCookingTimeMinutes: number;
  dailyBudgetUsd: number;
  peopleCount: number;
  dietaryPreference: DietaryPreference;
  existingIngredients: string[];
  cookingSkillLevel: CookingSkillLevel;
}

export interface NormalizedCookingPlanRequest extends CookingPlanRequest {
  existingIngredients: string[];
  normalizedIngredientSet: Set<string>;
}

export interface MealMacroEstimate {
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface IngredientLine {
  name: string;
  canonicalName: string;
  quantity: number;
  unit: QuantityUnit;
  note?: string;
  optional: boolean;
  pantryCovered: boolean;
  estimatedCostUsd: number;
}

export interface Substitution {
  from: string;
  to: string;
  reason: string;
  estimatedSavingsUsd?: number;
}

export interface MealPlan {
  slot: MealSlot;
  recipeName: string;
  summary: string;
  preparationSteps: string[];
  estimatedPreparationTimeMinutes: number;
  estimatedCostUsd: number;
  calories: number;
  macros: MealMacroEstimate;
  ingredients: IngredientLine[];
  substitutions: Substitution[];
}

export interface GroceryItem {
  name: string;
  canonicalName: string;
  quantity: number;
  unit: QuantityUnit;
  estimatedCostUsd: number;
  category: string;
  pantryCovered: boolean;
}

export interface BudgetAdjustment {
  action: "swap" | "remove";
  ingredient: string;
  alternative?: string;
  originalCostUsd: number;
  optimizedCostUsd: number;
  savingsUsd: number;
  reason: string;
}

export interface BudgetAnalysis {
  status: BudgetStatus;
  optimizedStatus: BudgetStatus;
  dailyBudgetUsd: number;
  totalEstimatedCostUsd: number;
  optimizedTotalCostUsd: number;
  varianceUsd: number;
  explanation: string;
  savingsSuggestions: string[];
  adjustments: BudgetAdjustment[];
}

export interface PromptMetadata {
  model: string;
  promptVersion: string;
  responseSchemaVersion: string;
  temperature: number;
  maxOutputTokens: number;
}

export interface PlanResult {
  id: string;
  createdAt: string;
  inputSnapshot: CookingPlanRequest;
  meals: Record<MealSlot, MealPlan>;
  groceryList: GroceryItem[];
  substitutions: Substitution[];
  budgetAnalysis: BudgetAnalysis;
  promptMetadata: PromptMetadata;
}

export interface SavedPlanSummary {
  id: string;
  createdAt: string;
  dietaryPreference: DietaryPreference;
  totalEstimatedCostUsd: number;
  budgetStatus: BudgetStatus;
  headline: string;
  mealNames: Record<MealSlot, string>;
}

export interface StoredProfile {
  ownerId: string;
  latestPreferences: CookingPlanRequest;
  createdAt: string;
  updatedAt: string;
}

export interface StoredPlan {
  id: string;
  ownerId: string;
  result: PlanResult;
  summary: SavedPlanSummary;
}

export interface AppErrorShape {
  code: string;
  message: string;
  status: number;
  details?: Record<string, string[]>;
}
