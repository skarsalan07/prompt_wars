import styles from "@/components/results-empty-state.module.css";

export function ResultsEmptyState() {
  return (
    <section className={styles.card} aria-labelledby="empty-state-title">
      <p className={styles.eyebrow}>Generated output</p>
      <h2 id="empty-state-title">Your meal plan will land here.</h2>
      <p className={styles.body}>
        Fill in the form with your time, budget, skill level, and pantry ingredients. The assistant will return breakfast, lunch,
        dinner, a grocery list, substitutions, and a budget analysis in one pass.
      </p>
      <ul className={styles.highlights}>
        <li>Breakfast, lunch, and dinner cards with prep steps and nutrition estimates.</li>
        <li>A consolidated grocery list that deducts pantry ingredients you already have.</li>
        <li>Budget alerts with cheaper alternatives and recalculated savings.</li>
      </ul>
    </section>
  );
}
