import styles from "@/components/stack-card.module.css";
import type { Substitution } from "@/lib/cooking-assistant/types";
import { currencyFormatter } from "@/lib/client/formatters";

interface SubstitutionsSectionProps {
  substitutions: Substitution[];
}

export function SubstitutionsSection({ substitutions }: SubstitutionsSectionProps) {
  return (
    <section className={styles.card} aria-labelledby="substitutions-title">
      <div className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>Flexibility</p>
          <h3 id="substitutions-title">Ingredient Substitutions</h3>
        </div>
      </div>

      {substitutions.length === 0 ? (
        <p className={styles.emptyState}>No substitutions were needed for this plan.</p>
      ) : (
        <ul className={styles.list}>
          {substitutions.map((item) => (
            <li key={`${item.from}-${item.to}`}>
              <div>
                <strong>
                  {item.from} → {item.to}
                </strong>
                <p>{item.reason}</p>
              </div>
              <span>{item.estimatedSavingsUsd ? currencyFormatter.format(item.estimatedSavingsUsd) : "Swap option"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
