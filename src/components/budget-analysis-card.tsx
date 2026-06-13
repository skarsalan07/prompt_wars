import styles from "@/components/budget-analysis-card.module.css";
import type { BudgetAnalysis } from "@/lib/cooking-assistant/types";
import { currencyFormatter } from "@/lib/client/formatters";

interface BudgetAnalysisCardProps {
  analysis: BudgetAnalysis;
}

export function BudgetAnalysisCard({ analysis }: BudgetAnalysisCardProps) {
  return (
    <section className={styles.card} aria-labelledby="budget-analysis-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Budget Feasibility Engine</p>
          <h3 id="budget-analysis-title">Budget Analysis</h3>
        </div>
        <span className={`${styles.badge} ${styles[analysis.status.replace(/\s+/g, "")]}`}>{analysis.status}</span>
      </header>

      <p className={styles.explanation}>{analysis.explanation}</p>

      <dl className={styles.metrics}>
        <div>
          <dt>Budget</dt>
          <dd>{currencyFormatter.format(analysis.dailyBudgetUsd)}</dd>
        </div>
        <div>
          <dt>Current Total</dt>
          <dd>{currencyFormatter.format(analysis.totalEstimatedCostUsd)}</dd>
        </div>
        <div>
          <dt>Optimized Total</dt>
          <dd>{currencyFormatter.format(analysis.optimizedTotalCostUsd)}</dd>
        </div>
        <div>
          <dt>Variance</dt>
          <dd>{currencyFormatter.format(analysis.varianceUsd)}</dd>
        </div>
      </dl>

      <div className={styles.columns}>
        <div>
          <h4>Savings Suggestions</h4>
          {analysis.savingsSuggestions.length === 0 ? (
            <p className={styles.emptyState}>No changes are needed to stay on budget.</p>
          ) : (
            <ul className={styles.list}>
              {analysis.savingsSuggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h4>Adjustments</h4>
          {analysis.adjustments.length === 0 ? (
            <p className={styles.emptyState}>The current plan is already budget-efficient.</p>
          ) : (
            <ul className={styles.adjustments}>
              {analysis.adjustments.map((adjustment) => (
                <li key={`${adjustment.action}-${adjustment.ingredient}-${adjustment.alternative ?? "remove"}`}>
                  <strong>{adjustment.action === "swap" ? `${adjustment.ingredient} → ${adjustment.alternative}` : `Remove ${adjustment.ingredient}`}</strong>
                  <p>{adjustment.reason}</p>
                  <span>Saves {currencyFormatter.format(adjustment.savingsUsd)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
