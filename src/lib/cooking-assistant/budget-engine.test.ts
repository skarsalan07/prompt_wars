import { describe, expect, it } from "vitest";

import { buildBudgetAnalysis, classifyBudgetStatus, collectPlanSubstitutions, consolidateGroceryItems } from "@/lib/cooking-assistant/budget-engine";
import type { MealPlan } from "@/lib/cooking-assistant/types";

const sampleMeals: MealPlan[] = [
  {
    slot: "breakfast",
    recipeName: "Oats Bowl",
    summary: "Simple oats with banana.",
    preparationSteps: ["Boil oats.", "Top with banana."],
    estimatedPreparationTimeMinutes: 10,
    estimatedCostUsd: 2.25,
    calories: 320,
    macros: { proteinGrams: 14, carbsGrams: 50, fatGrams: 8 },
    ingredients: [
      {
        name: "Rolled Oats",
        canonicalName: "rolled oats",
        quantity: 1,
        unit: "cup",
        optional: false,
        pantryCovered: false,
        estimatedCostUsd: 0.55,
      },
      {
        name: "Banana",
        canonicalName: "banana",
        quantity: 2,
        unit: "piece",
        optional: false,
        pantryCovered: false,
        estimatedCostUsd: 0.56,
      },
      {
        name: "Milk",
        canonicalName: "milk",
        quantity: 1,
        unit: "cup",
        optional: false,
        pantryCovered: false,
        estimatedCostUsd: 0.3,
      },
    ],
    substitutions: [],
  },
  {
    slot: "lunch",
    recipeName: "Salmon Rice Bowl",
    summary: "Salmon with rice and greens.",
    preparationSteps: ["Cook salmon.", "Serve over rice."],
    estimatedPreparationTimeMinutes: 25,
    estimatedCostUsd: 7.5,
    calories: 610,
    macros: { proteinGrams: 35, carbsGrams: 42, fatGrams: 24 },
    ingredients: [
      {
        name: "Salmon",
        canonicalName: "salmon",
        quantity: 8,
        unit: "ounce",
        optional: false,
        pantryCovered: false,
        estimatedCostUsd: 10,
      },
      {
        name: "Rice",
        canonicalName: "rice",
        quantity: 2,
        unit: "cup",
        optional: false,
        pantryCovered: false,
        estimatedCostUsd: 0.9,
      },
    ],
    substitutions: [],
  },
  {
    slot: "dinner",
    recipeName: "Paneer Wrap",
    summary: "Paneer wrap with vegetables.",
    preparationSteps: ["Saute paneer.", "Roll into tortillas."],
    estimatedPreparationTimeMinutes: 20,
    estimatedCostUsd: 5.5,
    calories: 540,
    macros: { proteinGrams: 28, carbsGrams: 35, fatGrams: 22 },
    ingredients: [
      {
        name: "Paneer",
        canonicalName: "paneer",
        quantity: 6,
        unit: "ounce",
        optional: false,
        pantryCovered: false,
        estimatedCostUsd: 3.9,
      },
      {
        name: "Tortilla",
        canonicalName: "tortilla",
        quantity: 4,
        unit: "piece",
        optional: false,
        pantryCovered: false,
        estimatedCostUsd: 1.2,
      },
    ],
    substitutions: [],
  },
];

describe("budget engine", () => {
  it("classifies budget states correctly", () => {
    expect(classifyBudgetStatus(8.5, 10)).toBe("Within Budget");
    expect(classifyBudgetStatus(9.4, 10)).toBe("Near Limit");
    expect(classifyBudgetStatus(10.5, 10)).toBe("Over Budget");
    expect(classifyBudgetStatus(0, 0)).toBe("Within Budget");
    expect(classifyBudgetStatus(0.5, 0)).toBe("Over Budget");
  });

  it("consolidates grocery items across meals", () => {
    const groceryList = consolidateGroceryItems(sampleMeals);

    expect(groceryList).toHaveLength(7);
    expect(groceryList.find((item) => item.canonicalName === "salmon")?.estimatedCostUsd).toBe(10);
  });

  it("suggests cheaper alternatives when over budget", () => {
    const groceryList = consolidateGroceryItems(sampleMeals);
    const analysis = buildBudgetAnalysis(groceryList, 8, "Vegetarian");

    expect(analysis.status).toBe("Over Budget");
    expect(analysis.adjustments.some((adjustment) => adjustment.alternative === "Tofu")).toBe(true);
    expect(analysis.optimizedTotalCostUsd).toBeLessThan(analysis.totalEstimatedCostUsd);
  });

  it("collects substitution suggestions from the grocery list", () => {
    const substitutions = collectPlanSubstitutions(consolidateGroceryItems(sampleMeals), "Vegetarian");

    expect(substitutions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: "Milk", to: "Soy Milk" }),
        expect.objectContaining({ from: "Paneer", to: "Tofu" }),
      ]),
    );
  });
});
