import styles from "@/components/recent-plans-list.module.css";
import type { SavedPlanSummary } from "@/lib/cooking-assistant/types";
import { currencyFormatter } from "@/lib/client/formatters";

interface RecentPlansListProps {
  plans: SavedPlanSummary[];
  currentPlanId?: string;
  isLoadingPlan: boolean;
  onSelect: (id: string) => void;
}

export function RecentPlansList({ plans, currentPlanId, isLoadingPlan, onSelect }: RecentPlansListProps) {
  return (
    <section className={styles.card} aria-labelledby="recent-plans-title">
      <div className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>Saved Sessions</p>
          <h2 id="recent-plans-title">Recent Plans</h2>
        </div>
      </div>

      {plans.length === 0 ? (
        <p className={styles.emptyState}>Generated plans will appear here for this anonymous session.</p>
      ) : (
        <ul className={styles.list}>
          {plans.map((plan) => {
            const isActive = plan.id === currentPlanId;
            return (
              <li key={plan.id}>
                <button
                  className={`${styles.button} ${isActive ? styles.active : ""}`}
                  type="button"
                  onClick={() => onSelect(plan.id)}
                  aria-pressed={isActive}
                  disabled={isLoadingPlan && !isActive}
                >
                  <span className={styles.headline}>{plan.headline}</span>
                  <span className={styles.metaRow}>
                    <span>{new Date(plan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    <span>{plan.budgetStatus}</span>
                    <span>{currencyFormatter.format(plan.totalEstimatedCostUsd)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
