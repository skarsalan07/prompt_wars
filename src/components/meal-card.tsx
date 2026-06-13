import styles from "@/components/meal-card.module.css";
import type { MealPlan } from "@/lib/cooking-assistant/types";
import { currencyFormatter, formatMacro } from "@/lib/client/formatters";

interface MealCardProps {
  meal: MealPlan;
}

export function MealCard({ meal }: MealCardProps) {
  return (
    <article className={styles.card} aria-labelledby={`${meal.slot}-title`}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{meal.slot}</p>
          <h3 className={styles.title} id={`${meal.slot}-title`}>
            {meal.recipeName}
          </h3>
        </div>
        <div className={styles.metrics}>
          <span>{meal.estimatedPreparationTimeMinutes} min</span>
          <span>{currencyFormatter.format(meal.estimatedCostUsd)}</span>
        </div>
      </header>

      <p className={styles.summary}>{meal.summary}</p>

      <dl className={styles.nutritionGrid}>
        <div>
          <dt>Calories</dt>
          <dd>{meal.calories}</dd>
        </div>
        <div>
          <dt>Protein</dt>
          <dd>{formatMacro(meal.macros.proteinGrams)}</dd>
        </div>
        <div>
          <dt>Carbs</dt>
          <dd>{formatMacro(meal.macros.carbsGrams)}</dd>
        </div>
        <div>
          <dt>Fat</dt>
          <dd>{formatMacro(meal.macros.fatGrams)}</dd>
        </div>
      </dl>

      <div className={styles.section}>
        <h4>Ingredients</h4>
        <ul className={styles.list}>
          {meal.ingredients.map((ingredient) => (
            <li key={`${ingredient.canonicalName}-${ingredient.unit}-${ingredient.quantity}`}>
              <span>
                {ingredient.quantity} {ingredient.unit}
                {ingredient.quantity > 1 &&
                !["teaspoon", "tablespoon", "cup", "ounce", "pound", "gram", "kilogram", "milliliter", "liter"].includes(ingredient.unit)
                  ? "s"
                  : ""}{" "}
                {ingredient.name}
                {ingredient.note ? `, ${ingredient.note}` : ""}
              </span>
              <span className={styles.ingredientMeta}>
                {ingredient.pantryCovered ? "Pantry" : currencyFormatter.format(ingredient.estimatedCostUsd)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.section}>
        <h4>Preparation Steps</h4>
        <ol className={styles.steps}>
          {meal.preparationSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    </article>
  );
}
