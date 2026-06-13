"use client";

import { startTransition, useEffect, useEffectEvent, useState } from "react";

import styles from "@/components/cooking-assistant-app.module.css";
import { BudgetAnalysisCard } from "@/components/budget-analysis-card";
import { GrocerySection } from "@/components/grocery-section";
import { MealCard } from "@/components/meal-card";
import { PlanForm } from "@/components/plan-form";
import { RecentPlansList } from "@/components/recent-plans-list";
import { ResultsEmptyState } from "@/components/results-empty-state";
import { SubstitutionsSection } from "@/components/substitutions-section";
import type { CookingPlanRequest, PlanResult, SavedPlanSummary } from "@/lib/cooking-assistant/types";
import { createCookingPlan, fetchPreferences, fetchRecentPlans, fetchSavedPlan } from "@/lib/client/api";

const DEFAULT_REQUEST: CookingPlanRequest = {
  availableCookingTimeMinutes: 35,
  dailyBudgetUsd: 25,
  peopleCount: 2,
  dietaryPreference: "Vegetarian",
  existingIngredients: [],
  cookingSkillLevel: "Beginner",
};

export function CookingAssistantApp() {
  const [preferences, setPreferences] = useState<CookingPlanRequest>(DEFAULT_REQUEST);
  const [recentPlans, setRecentPlans] = useState<SavedPlanSummary[]>([]);
  const [currentPlan, setCurrentPlan] = useState<PlanResult | null>(null);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Loading saved session data.");

  const bootstrap = useEffectEvent(async () => {
    setBootstrapLoading(true);
    setErrorMessage(null);

    try {
      const savedPreferences = await fetchPreferences();
      if (savedPreferences) {
        startTransition(() => {
          setPreferences(savedPreferences);
        });
      }

      const plans = await fetchRecentPlans();
      startTransition(() => {
        setRecentPlans(plans);
      });
      setStatusMessage(plans.length > 0 ? "Saved plans loaded." : "Ready to generate a new plan.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load session data.");
      setStatusMessage("There was a problem loading saved data.");
    } finally {
      setBootstrapLoading(false);
    }
  });

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const handleGeneratePlan = async (payload: CookingPlanRequest) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage("Generating your cooking plan.");

    try {
      const plan = await createCookingPlan(payload);
      const plans = await fetchRecentPlans();
      startTransition(() => {
        setCurrentPlan(plan);
        setPreferences(payload);
        setRecentPlans(plans);
      });
      setStatusMessage("New cooking plan generated.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to generate the cooking plan.");
      setStatusMessage("Plan generation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPlan = useEffectEvent(async (id: string) => {
    setIsLoadingPlan(true);
    setErrorMessage(null);
    setStatusMessage("Loading saved plan.");

    try {
      const plan = await fetchSavedPlan(id);
      startTransition(() => {
        setCurrentPlan(plan);
        setPreferences(plan.inputSnapshot);
      });
      setStatusMessage("Saved plan loaded.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load that saved plan.");
      setStatusMessage("Saved plan load failed.");
    } finally {
      setIsLoadingPlan(false);
    }
  });

  return (
    <main className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>AI-Powered Daily Meal Planning</p>
          <h1>Cooking To-Do Assistant</h1>
          <p className={styles.description}>
            Turn your time, budget, diet, pantry, and skill level into a realistic breakfast, lunch, and dinner plan with a
            grocery list and budget-saving swaps.
          </p>
          <div className={styles.heroStats}>
            <span>Groq structured output</span>
            <span>Budget feasibility engine</span>
            <span>Anonymous saved sessions</span>
          </div>
        </div>

        <div className={styles.heroPanel}>
          <p className={styles.panelLabel}>What the app returns</p>
          <ul>
            <li>Three meal cards with steps, prep time, calories, and macros.</li>
            <li>A consolidated grocery list that respects pantry ingredients.</li>
            <li>Budget status, savings suggestions, and ingredient substitutions.</li>
          </ul>
        </div>
      </header>

      <div className="sr-only" aria-live="polite">
        {statusMessage}
      </div>

      <div className={styles.layout}>
        <aside className={styles.leftRail}>
          <PlanForm initialValues={preferences} isSubmitting={isSubmitting} onSubmit={handleGeneratePlan} />
          <RecentPlansList
            plans={recentPlans}
            currentPlanId={currentPlan?.id}
            isLoadingPlan={isLoadingPlan}
            onSelect={(id) => {
              void handleSelectPlan(id);
            }}
          />
        </aside>

        <section className={styles.resultsColumn} aria-busy={isSubmitting || isLoadingPlan || bootstrapLoading}>
          {errorMessage ? <p className={styles.errorBanner}>{errorMessage}</p> : null}

          {bootstrapLoading ? <div className={styles.loadingPanel}>Restoring your session preferences and recent plans...</div> : null}

          {!bootstrapLoading && currentPlan ? (
            <>
              <section className={styles.summaryHeader} aria-labelledby="current-plan-title">
                <div>
                  <p className={styles.kicker}>Generated Plan</p>
                  <h2 id="current-plan-title">Meals for {currentPlan.inputSnapshot.peopleCount} people</h2>
                </div>
                <div className={styles.planMeta}>
                  <span>{currentPlan.inputSnapshot.dietaryPreference}</span>
                  <span>{currentPlan.inputSnapshot.cookingSkillLevel}</span>
                  <span>{currentPlan.inputSnapshot.availableCookingTimeMinutes} min/day</span>
                </div>
              </section>

              <div className={styles.mealGrid}>
                <MealCard meal={currentPlan.meals.breakfast} />
                <MealCard meal={currentPlan.meals.lunch} />
                <MealCard meal={currentPlan.meals.dinner} />
              </div>

              <BudgetAnalysisCard analysis={currentPlan.budgetAnalysis} />

              <div className={styles.bottomGrid}>
                <GrocerySection items={currentPlan.groceryList} />
                <SubstitutionsSection substitutions={currentPlan.substitutions} />
              </div>
            </>
          ) : null}

          {!bootstrapLoading && !currentPlan ? <ResultsEmptyState /> : null}
        </section>
      </div>
    </main>
  );
}
