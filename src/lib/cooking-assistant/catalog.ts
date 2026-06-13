import type { DietaryPreference, QuantityUnit, Substitution } from "@/lib/cooking-assistant/types";

type IngredientTag =
  | "meat"
  | "fish"
  | "dairy"
  | "egg"
  | "rootVegetable"
  | "mushroom"
  | "highCarb"
  | "premium";

export interface CatalogIngredient {
  canonicalName: string;
  displayName: string;
  unit: QuantityUnit;
  pricePerUnitUsd: number;
  category: string;
  aliases: string[];
  tags: IngredientTag[];
}

interface SubstitutionRule {
  from: string;
  replacements: Array<{
    to: string;
    reason: string;
  }>;
}

export const DEFAULT_PANTRY_ITEMS = ["salt", "pepper", "oil", "water"] as const;

export const CATALOG_INGREDIENTS: CatalogIngredient[] = [
  { canonicalName: "water", displayName: "Water", unit: "cup", pricePerUnitUsd: 0, category: "pantry", aliases: [], tags: [] },
  { canonicalName: "salt", displayName: "Salt", unit: "teaspoon", pricePerUnitUsd: 0.01, category: "pantry", aliases: [], tags: [] },
  { canonicalName: "pepper", displayName: "Pepper", unit: "teaspoon", pricePerUnitUsd: 0.04, category: "pantry", aliases: ["black pepper"], tags: [] },
  { canonicalName: "oil", displayName: "Oil", unit: "tablespoon", pricePerUnitUsd: 0.18, category: "pantry", aliases: ["olive oil", "vegetable oil"], tags: [] },
  { canonicalName: "rolled oats", displayName: "Rolled Oats", unit: "cup", pricePerUnitUsd: 0.55, category: "grain", aliases: ["oats"], tags: ["highCarb"] },
  { canonicalName: "rice", displayName: "Rice", unit: "cup", pricePerUnitUsd: 0.45, category: "grain", aliases: ["brown rice", "white rice"], tags: ["highCarb"] },
  { canonicalName: "quinoa", displayName: "Quinoa", unit: "cup", pricePerUnitUsd: 1.2, category: "grain", aliases: [], tags: ["highCarb"] },
  { canonicalName: "pasta", displayName: "Pasta", unit: "cup", pricePerUnitUsd: 0.7, category: "grain", aliases: ["whole wheat pasta"], tags: ["highCarb"] },
  { canonicalName: "whole wheat bread", displayName: "Whole Wheat Bread", unit: "slice", pricePerUnitUsd: 0.18, category: "grain", aliases: ["bread", "whole grain bread"], tags: ["highCarb"] },
  { canonicalName: "tortilla", displayName: "Tortilla", unit: "piece", pricePerUnitUsd: 0.3, category: "grain", aliases: ["whole wheat tortilla", "wrap"], tags: ["highCarb"] },
  { canonicalName: "cauliflower rice", displayName: "Cauliflower Rice", unit: "cup", pricePerUnitUsd: 1.2, category: "vegetable", aliases: [], tags: [] },
  { canonicalName: "chickpea flour", displayName: "Chickpea Flour", unit: "cup", pricePerUnitUsd: 0.65, category: "grain", aliases: ["besan"], tags: ["highCarb"] },
  { canonicalName: "milk", displayName: "Milk", unit: "cup", pricePerUnitUsd: 0.3, category: "dairy", aliases: [], tags: ["dairy"] },
  { canonicalName: "soy milk", displayName: "Soy Milk", unit: "cup", pricePerUnitUsd: 0.4, category: "plant-based dairy", aliases: [], tags: [] },
  { canonicalName: "almond milk", displayName: "Almond Milk", unit: "cup", pricePerUnitUsd: 0.45, category: "plant-based dairy", aliases: [], tags: [] },
  { canonicalName: "coconut milk", displayName: "Coconut Milk", unit: "cup", pricePerUnitUsd: 0.75, category: "plant-based dairy", aliases: [], tags: [] },
  { canonicalName: "greek yogurt", displayName: "Greek Yogurt", unit: "cup", pricePerUnitUsd: 1.25, category: "dairy", aliases: [], tags: ["dairy"] },
  { canonicalName: "yogurt", displayName: "Yogurt", unit: "cup", pricePerUnitUsd: 0.95, category: "dairy", aliases: ["plain yogurt"], tags: ["dairy"] },
  { canonicalName: "cottage cheese", displayName: "Cottage Cheese", unit: "cup", pricePerUnitUsd: 1.1, category: "dairy", aliases: [], tags: ["dairy"] },
  { canonicalName: "paneer", displayName: "Paneer", unit: "ounce", pricePerUnitUsd: 0.65, category: "dairy", aliases: [], tags: ["dairy", "premium"] },
  { canonicalName: "tofu", displayName: "Tofu", unit: "ounce", pricePerUnitUsd: 0.45, category: "protein", aliases: ["firm tofu"], tags: [] },
  { canonicalName: "tempeh", displayName: "Tempeh", unit: "ounce", pricePerUnitUsd: 0.55, category: "protein", aliases: [], tags: [] },
  { canonicalName: "edamame", displayName: "Edamame", unit: "cup", pricePerUnitUsd: 1.05, category: "protein", aliases: [], tags: [] },
  { canonicalName: "eggs", displayName: "Eggs", unit: "piece", pricePerUnitUsd: 0.35, category: "protein", aliases: ["egg"], tags: ["egg"] },
  { canonicalName: "chicken breast", displayName: "Chicken Breast", unit: "ounce", pricePerUnitUsd: 0.75, category: "protein", aliases: ["chicken"], tags: ["meat"] },
  { canonicalName: "turkey", displayName: "Turkey", unit: "ounce", pricePerUnitUsd: 0.85, category: "protein", aliases: ["turkey breast"], tags: ["meat"] },
  { canonicalName: "salmon", displayName: "Salmon", unit: "ounce", pricePerUnitUsd: 1.25, category: "protein", aliases: [], tags: ["fish", "premium"] },
  { canonicalName: "tuna", displayName: "Tuna", unit: "ounce", pricePerUnitUsd: 0.65, category: "protein", aliases: [], tags: ["fish"] },
  { canonicalName: "shrimp", displayName: "Shrimp", unit: "ounce", pricePerUnitUsd: 0.95, category: "protein", aliases: ["prawns"], tags: ["fish"] },
  { canonicalName: "lentils", displayName: "Lentils", unit: "cup", pricePerUnitUsd: 0.8, category: "protein", aliases: ["dal"], tags: ["highCarb"] },
  { canonicalName: "chickpeas", displayName: "Chickpeas", unit: "cup", pricePerUnitUsd: 1.1, category: "protein", aliases: ["garbanzo beans"], tags: ["highCarb"] },
  { canonicalName: "black beans", displayName: "Black Beans", unit: "cup", pricePerUnitUsd: 0.95, category: "protein", aliases: [], tags: ["highCarb"] },
  { canonicalName: "kidney beans", displayName: "Kidney Beans", unit: "cup", pricePerUnitUsd: 0.95, category: "protein", aliases: ["rajma"], tags: ["highCarb"] },
  { canonicalName: "spinach", displayName: "Spinach", unit: "cup", pricePerUnitUsd: 0.7, category: "vegetable", aliases: [], tags: [] },
  { canonicalName: "kale", displayName: "Kale", unit: "cup", pricePerUnitUsd: 0.8, category: "vegetable", aliases: [], tags: [] },
  { canonicalName: "lettuce", displayName: "Lettuce", unit: "cup", pricePerUnitUsd: 0.55, category: "vegetable", aliases: ["romaine"], tags: [] },
  { canonicalName: "tomato", displayName: "Tomato", unit: "piece", pricePerUnitUsd: 0.65, category: "vegetable", aliases: ["tomatoes"], tags: [] },
  { canonicalName: "onion", displayName: "Onion", unit: "piece", pricePerUnitUsd: 0.4, category: "vegetable", aliases: ["red onion"], tags: ["rootVegetable"] },
  { canonicalName: "garlic", displayName: "Garlic", unit: "clove", pricePerUnitUsd: 0.08, category: "vegetable", aliases: ["garlic clove"], tags: ["rootVegetable"] },
  { canonicalName: "ginger", displayName: "Ginger", unit: "tablespoon", pricePerUnitUsd: 0.12, category: "vegetable", aliases: [], tags: ["rootVegetable"] },
  { canonicalName: "bell pepper", displayName: "Bell Pepper", unit: "piece", pricePerUnitUsd: 1.1, category: "vegetable", aliases: ["capsicum"], tags: [] },
  { canonicalName: "mushroom", displayName: "Mushroom", unit: "cup", pricePerUnitUsd: 1.05, category: "vegetable", aliases: ["mushrooms"], tags: ["mushroom"] },
  { canonicalName: "zucchini", displayName: "Zucchini", unit: "piece", pricePerUnitUsd: 0.9, category: "vegetable", aliases: [], tags: [] },
  { canonicalName: "broccoli", displayName: "Broccoli", unit: "cup", pricePerUnitUsd: 0.85, category: "vegetable", aliases: [], tags: [] },
  { canonicalName: "cauliflower", displayName: "Cauliflower", unit: "cup", pricePerUnitUsd: 0.9, category: "vegetable", aliases: [], tags: [] },
  { canonicalName: "cucumber", displayName: "Cucumber", unit: "piece", pricePerUnitUsd: 0.8, category: "vegetable", aliases: [], tags: [] },
  { canonicalName: "potato", displayName: "Potato", unit: "piece", pricePerUnitUsd: 0.55, category: "vegetable", aliases: ["potatoes"], tags: ["rootVegetable", "highCarb"] },
  { canonicalName: "sweet potato", displayName: "Sweet Potato", unit: "piece", pricePerUnitUsd: 0.8, category: "vegetable", aliases: [], tags: ["rootVegetable", "highCarb"] },
  { canonicalName: "carrot", displayName: "Carrot", unit: "piece", pricePerUnitUsd: 0.25, category: "vegetable", aliases: ["carrots"], tags: ["rootVegetable", "highCarb"] },
  { canonicalName: "peas", displayName: "Peas", unit: "cup", pricePerUnitUsd: 0.6, category: "vegetable", aliases: ["green peas"], tags: ["highCarb"] },
  { canonicalName: "corn", displayName: "Corn", unit: "cup", pricePerUnitUsd: 0.7, category: "vegetable", aliases: [], tags: ["highCarb"] },
  { canonicalName: "cabbage", displayName: "Cabbage", unit: "cup", pricePerUnitUsd: 0.45, category: "vegetable", aliases: [], tags: [] },
  { canonicalName: "green beans", displayName: "Green Beans", unit: "cup", pricePerUnitUsd: 0.7, category: "vegetable", aliases: [], tags: [] },
  { canonicalName: "eggplant", displayName: "Eggplant", unit: "cup", pricePerUnitUsd: 0.75, category: "vegetable", aliases: ["aubergine"], tags: [] },
  { canonicalName: "pumpkin", displayName: "Pumpkin", unit: "cup", pricePerUnitUsd: 0.65, category: "vegetable", aliases: [], tags: ["highCarb"] },
  { canonicalName: "avocado", displayName: "Avocado", unit: "piece", pricePerUnitUsd: 1.6, category: "fruit", aliases: [], tags: ["premium"] },
  { canonicalName: "banana", displayName: "Banana", unit: "piece", pricePerUnitUsd: 0.28, category: "fruit", aliases: [], tags: ["highCarb"] },
  { canonicalName: "apple", displayName: "Apple", unit: "piece", pricePerUnitUsd: 0.7, category: "fruit", aliases: [], tags: ["highCarb"] },
  { canonicalName: "berries", displayName: "Berries", unit: "cup", pricePerUnitUsd: 1.9, category: "fruit", aliases: ["mixed berries", "blueberries"], tags: ["premium", "highCarb"] },
  { canonicalName: "almonds", displayName: "Almonds", unit: "ounce", pricePerUnitUsd: 0.65, category: "nut", aliases: [], tags: [] },
  { canonicalName: "walnuts", displayName: "Walnuts", unit: "ounce", pricePerUnitUsd: 0.8, category: "nut", aliases: [], tags: ["premium"] },
  { canonicalName: "peanut butter", displayName: "Peanut Butter", unit: "tablespoon", pricePerUnitUsd: 0.18, category: "spread", aliases: [], tags: [] },
  { canonicalName: "chia seeds", displayName: "Chia Seeds", unit: "tablespoon", pricePerUnitUsd: 0.22, category: "seed", aliases: [], tags: [] },
  { canonicalName: "soy sauce", displayName: "Soy Sauce", unit: "tablespoon", pricePerUnitUsd: 0.1, category: "condiment", aliases: [], tags: [] },
  { canonicalName: "tahini", displayName: "Tahini", unit: "tablespoon", pricePerUnitUsd: 0.3, category: "condiment", aliases: [], tags: ["premium"] },
  { canonicalName: "lemon", displayName: "Lemon", unit: "piece", pricePerUnitUsd: 0.5, category: "fruit", aliases: [], tags: [] },
  { canonicalName: "cumin", displayName: "Cumin", unit: "teaspoon", pricePerUnitUsd: 0.05, category: "spice", aliases: [], tags: [] },
  { canonicalName: "turmeric", displayName: "Turmeric", unit: "teaspoon", pricePerUnitUsd: 0.04, category: "spice", aliases: [], tags: [] },
  { canonicalName: "paprika", displayName: "Paprika", unit: "teaspoon", pricePerUnitUsd: 0.05, category: "spice", aliases: [], tags: [] },
  { canonicalName: "chili flakes", displayName: "Chili Flakes", unit: "teaspoon", pricePerUnitUsd: 0.04, category: "spice", aliases: [], tags: [] },
  { canonicalName: "garam masala", displayName: "Garam Masala", unit: "teaspoon", pricePerUnitUsd: 0.08, category: "spice", aliases: [], tags: [] },
  { canonicalName: "cinnamon", displayName: "Cinnamon", unit: "teaspoon", pricePerUnitUsd: 0.05, category: "spice", aliases: [], tags: [] },
];

const substitutionRules: SubstitutionRule[] = [
  {
    from: "milk",
    replacements: [
      { to: "soy milk", reason: "Keeps a creamy texture while staying dairy-free." },
      { to: "almond milk", reason: "Lowers cost and works well for smoothies or oats." },
    ],
  },
  {
    from: "paneer",
    replacements: [{ to: "tofu", reason: "Tofu is lighter on budget and works in the same stir-fry or curry format." }],
  },
  {
    from: "chicken breast",
    replacements: [
      { to: "chickpeas", reason: "Chickpeas reduce total cost and still add protein." },
      { to: "tofu", reason: "Tofu keeps protein high while lowering spend." },
    ],
  },
  {
    from: "salmon",
    replacements: [
      { to: "tuna", reason: "Tuna offers a similar protein boost at a lower cost." },
      { to: "tofu", reason: "Tofu is a budget-friendly option for bowls and salads." },
    ],
  },
  {
    from: "quinoa",
    replacements: [{ to: "rice", reason: "Rice keeps the bowl filling while lowering cost." }],
  },
  {
    from: "greek yogurt",
    replacements: [{ to: "yogurt", reason: "Plain yogurt lowers spend and keeps the meal creamy." }],
  },
  {
    from: "berries",
    replacements: [{ to: "banana", reason: "Bananas are far cheaper and still add sweetness." }],
  },
  {
    from: "avocado",
    replacements: [{ to: "cucumber", reason: "Cucumber keeps freshness in wraps and bowls at lower cost." }],
  },
  {
    from: "walnuts",
    replacements: [{ to: "almonds", reason: "Almonds cut the cost of crunchy toppings." }],
  },
  {
    from: "coconut milk",
    replacements: [{ to: "soy milk", reason: "Soy milk keeps sauces creamy while reducing spend." }],
  },
];

const volumeToMilliliters: Partial<Record<QuantityUnit, number>> = {
  teaspoon: 5,
  tablespoon: 15,
  cup: 240,
  milliliter: 1,
  liter: 1000,
};

const weightToGrams: Partial<Record<QuantityUnit, number>> = {
  gram: 1,
  kilogram: 1000,
  ounce: 28.35,
  pound: 453.59,
};

const ingredientLookup = new Map<string, CatalogIngredient>();

for (const ingredient of CATALOG_INGREDIENTS) {
  ingredientLookup.set(ingredient.canonicalName, ingredient);
  for (const alias of ingredient.aliases) {
    ingredientLookup.set(alias.toLowerCase(), ingredient);
  }
}

export function getCatalogIngredient(name: string): CatalogIngredient | undefined {
  return ingredientLookup.get(name.toLowerCase());
}

export function getIngredientDisplayName(name: string): string {
  return getCatalogIngredient(name)?.displayName ?? toTitleCase(name);
}

export function normalizeIngredientName(rawName: string): string {
  const sanitized = rawName.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, " ");
  if (!sanitized) {
    return "";
  }

  return getCatalogIngredient(sanitized)?.canonicalName ?? sanitized;
}

export function estimateIngredientCost(canonicalName: string, quantity: number, unit: QuantityUnit): number {
  const ingredient = getCatalogIngredient(canonicalName);
  if (!ingredient) {
    return roundCurrency(Math.max(0.1, quantity * 0.45));
  }

  if (ingredient.unit === unit) {
    return roundCurrency(quantity * ingredient.pricePerUnitUsd);
  }

  const volumeQuantity = convertVolume(quantity, unit, ingredient.unit);
  if (volumeQuantity !== null) {
    return roundCurrency(volumeQuantity * ingredient.pricePerUnitUsd);
  }

  const weightQuantity = convertWeight(quantity, unit, ingredient.unit);
  if (weightQuantity !== null) {
    return roundCurrency(weightQuantity * ingredient.pricePerUnitUsd);
  }

  return roundCurrency(quantity * ingredient.pricePerUnitUsd);
}

export function listCatalogForPrompt(): string[] {
  return CATALOG_INGREDIENTS.filter((ingredient) => !DEFAULT_PANTRY_ITEMS.includes(ingredient.canonicalName as (typeof DEFAULT_PANTRY_ITEMS)[number]))
    .map((ingredient) => `${ingredient.displayName} (${ingredient.unit})`);
}

export function isIngredientAllowedForDiet(canonicalName: string, diet: DietaryPreference): boolean {
  const ingredient = getCatalogIngredient(canonicalName);
  if (!ingredient) {
    return true;
  }

  if (diet === "Non-Vegetarian") {
    return true;
  }

  if (diet === "Vegetarian") {
    return !ingredient.tags.includes("meat") && !ingredient.tags.includes("fish") && !ingredient.tags.includes("egg");
  }

  if (diet === "Vegan") {
    return !ingredient.tags.some((tag) => tag === "meat" || tag === "fish" || tag === "egg" || tag === "dairy");
  }

  if (diet === "Jain") {
    return !ingredient.tags.some((tag) => tag === "meat" || tag === "fish" || tag === "egg" || tag === "rootVegetable" || tag === "mushroom");
  }

  if (diet === "Keto") {
    return !ingredient.tags.includes("highCarb");
  }

  return true;
}

export function getDietNotes(diet: DietaryPreference): string[] {
  switch (diet) {
    case "Vegetarian":
      return ["No meat, fish, or eggs.", "Dairy is allowed.", "Keep the meals balanced and easy to cook."];
    case "Vegan":
      return ["No meat, fish, eggs, dairy, or honey.", "Use plant-based proteins and dairy alternatives only."];
    case "Non-Vegetarian":
      return ["Animal proteins are allowed.", "Prefer balanced, practical meals over restaurant-style complexity."];
    case "Jain":
      return ["No meat, fish, or eggs.", "Avoid onion, garlic, mushrooms, and root vegetables such as potato, carrot, ginger, and sweet potato.", "Use simple Jain-friendly seasoning."];
    case "Keto":
      return ["Keep carbohydrates low and avoid grains, beans, starchy vegetables, and high-sugar fruit.", "Favor protein, dairy, leafy vegetables, nuts, and low-carb vegetables."];
    case "High Protein":
      return ["Target at least 25 grams of protein per meal.", "Keep meals practical and balanced instead of bodybuilder-only meal prep."];
    default:
      return [];
  }
}

export function findSubstitutionOptions(
  canonicalName: string,
  diet: DietaryPreference,
): Array<Substitution & { canonicalTo: string }> {
  const rule = substitutionRules.find((item) => item.from === canonicalName);
  if (!rule) {
    return [];
  }

  return rule.replacements
    .filter((replacement) => isIngredientAllowedForDiet(replacement.to, diet))
    .map((replacement) => {
      const original = getCatalogIngredient(canonicalName);
      const alternative = getCatalogIngredient(replacement.to);
      const estimatedSavingsUsd =
        original && alternative
          ? roundCurrency(Math.max(0, original.pricePerUnitUsd - alternative.pricePerUnitUsd))
          : undefined;

      return {
        from: getIngredientDisplayName(canonicalName),
        to: getIngredientDisplayName(replacement.to),
        reason: replacement.reason,
        estimatedSavingsUsd,
        canonicalTo: replacement.to,
      };
    });
}

export function getPremiumIngredients(): string[] {
  return CATALOG_INGREDIENTS.filter((ingredient) => ingredient.tags.includes("premium")).map((ingredient) => ingredient.canonicalName);
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function convertVolume(quantity: number, from: QuantityUnit, to: QuantityUnit): number | null {
  const fromFactor = volumeToMilliliters[from];
  const toFactor = volumeToMilliliters[to];
  if (!fromFactor || !toFactor) {
    return null;
  }

  return (quantity * fromFactor) / toFactor;
}

function convertWeight(quantity: number, from: QuantityUnit, to: QuantityUnit): number | null {
  const fromFactor = weightToGrams[from];
  const toFactor = weightToGrams[to];
  if (!fromFactor || !toFactor) {
    return null;
  }

  return (quantity * fromFactor) / toFactor;
}

function toTitleCase(value: string): string {
  return value.replace(/\b\w/g, (segment) => segment.toUpperCase());
}
