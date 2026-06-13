import { z } from "zod";

import {
  BUDGET_STATUSES,
  COOKING_SKILL_LEVELS,
  DIETARY_PREFERENCES,
  MEAL_SLOTS,
  QUANTITY_UNITS,
} from "@/lib/cooking-assistant/types";

const ingredientTokenSchema = z
  .string()
  .trim()
  .min(1, "Ingredient entries cannot be empty.")
  .max(40, "Ingredient names must be 40 characters or fewer.")
  .regex(/^[a-zA-Z0-9\s'()-]+$/, "Ingredient names may only use letters, numbers, spaces, apostrophes, parentheses, and hyphens.")
  .refine(
    (value) => !/(ignore|instruction|system|developer|prompt|secret|password|token|api key|script|html)/i.test(value),
    "Ingredient names cannot contain prompt-injection or script terms.",
  );

export const cookingPlanRequestSchema = z.object({
  availableCookingTimeMinutes: z.coerce.number().int().min(5, "Cooking time must be at least 5 minutes.").max(240, "Cooking time must be 240 minutes or less."),
  dailyBudgetUsd: z.coerce.number().min(0, "Budget cannot be negative.").max(500, "Budget must be $500 or less."),
  peopleCount: z.coerce.number().int().min(1, "At least one person must be served.").max(20, "People count must be 20 or less."),
  dietaryPreference: z.enum(DIETARY_PREFERENCES),
  existingIngredients: z.array(ingredientTokenSchema).max(24, "Use 24 ingredients or fewer."),
  cookingSkillLevel: z.enum(COOKING_SKILL_LEVELS),
});

export const quantityUnitSchema = z.enum(QUANTITY_UNITS);

export const aiIngredientSchema = z.object({
  name: z.string().trim().min(1).max(40),
  quantity: z.number().positive().max(16),
  unit: quantityUnitSchema,
  note: z.string().trim().max(80).optional().default(""),
  optional: z.boolean().default(false),
});

export const aiSubstitutionSchema = z.object({
  from: z.string().trim().min(1).max(40),
  to: z.string().trim().min(1).max(40),
  reason: z.string().trim().min(8).max(140),
});

export const aiMealSchema = z.object({
  slot: z.enum(MEAL_SLOTS),
  recipeName: z.string().trim().min(3).max(72),
  summary: z.string().trim().min(20).max(160),
  estimatedPreparationTimeMinutes: z.number().int().min(5).max(240),
  calories: z.number().int().min(100).max(1400),
  macros: z.object({
    proteinGrams: z.number().min(0).max(120),
    carbsGrams: z.number().min(0).max(150),
    fatGrams: z.number().min(0).max(100),
  }),
  ingredients: z.array(aiIngredientSchema).min(3).max(12),
  preparationSteps: z.array(z.string().trim().min(10).max(180)).min(2).max(7),
  suggestedSubstitutions: z.array(aiSubstitutionSchema).max(4).default([]),
});

export const aiPlanSchema = z
  .object({
    meals: z.array(aiMealSchema).length(3),
  })
  .superRefine((value, context) => {
    const slots = value.meals.map((meal) => meal.slot);
    for (const slot of MEAL_SLOTS) {
      if (!slots.includes(slot)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Missing ${slot} meal.`,
        });
      }
    }
  });

export const budgetStatusSchema = z.enum(BUDGET_STATUSES);

export type CookingPlanRequestInput = z.input<typeof cookingPlanRequestSchema>;
export type CookingPlanRequestPayload = z.output<typeof cookingPlanRequestSchema>;
export type AIPlanPayload = z.output<typeof aiPlanSchema>;
