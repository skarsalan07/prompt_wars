import styles from "@/components/stack-card.module.css";
import type { GroceryItem } from "@/lib/cooking-assistant/types";
import { currencyFormatter } from "@/lib/client/formatters";

interface GrocerySectionProps {
  items: GroceryItem[];
}

export function GrocerySection({ items }: GrocerySectionProps) {
  return (
    <section className={styles.card} aria-labelledby="grocery-list-title">
      <div className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>Shopping</p>
          <h3 id="grocery-list-title">Consolidated Grocery List</h3>
        </div>
      </div>

      {items.length === 0 ? (
        <p className={styles.emptyState}>Everything needed is already covered by the pantry list.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={`${item.canonicalName}-${item.unit}`}>
              <div>
                <strong>{item.name}</strong>
                <p>
                  {item.quantity} {item.unit}
                  {item.quantity > 1 &&
                  !["teaspoon", "tablespoon", "cup", "ounce", "pound", "gram", "kilogram", "milliliter", "liter"].includes(item.unit)
                    ? "s"
                    : ""}
                </p>
              </div>
              <span>{currencyFormatter.format(item.estimatedCostUsd)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
