"use client";

import { useDeferredValue, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import styles from "@/components/plan-form.module.css";
import type { CookingPlanRequest } from "@/lib/cooking-assistant/types";
import { COOKING_SKILL_LEVELS, DIETARY_PREFERENCES } from "@/lib/cooking-assistant/types";
import { parseIngredientText, toIngredientText } from "@/lib/client/formatters";

const planFormSchema = z.object({
  availableCookingTimeMinutes: z.coerce.number().int().min(5).max(240),
  dailyBudgetUsd: z.coerce.number().min(0).max(500),
  peopleCount: z.coerce.number().int().min(1).max(20),
  dietaryPreference: z.enum(DIETARY_PREFERENCES),
  cookingSkillLevel: z.enum(COOKING_SKILL_LEVELS),
  pantryText: z.string().max(600),
});

type PlanFormValues = z.output<typeof planFormSchema>;
type PlanFormInputValues = z.input<typeof planFormSchema>;

interface PlanFormProps {
  initialValues: CookingPlanRequest;
  isSubmitting: boolean;
  onSubmit: (payload: CookingPlanRequest) => Promise<void>;
}

export function PlanForm({ initialValues, isSubmitting, onSubmit }: PlanFormProps) {
  const form = useForm<PlanFormInputValues, undefined, PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: toFormValues(initialValues),
    mode: "onBlur",
  });

  useEffect(() => {
    form.reset(toFormValues(initialValues));
  }, [form, initialValues]);

  const pantryText = form.watch("pantryText");
  const deferredPantryText = useDeferredValue(pantryText);
  const pantryPreview = parseIngredientText(deferredPantryText);

  const submitHandler: SubmitHandler<PlanFormValues> = async (values) => {
    await onSubmit({
      availableCookingTimeMinutes: values.availableCookingTimeMinutes,
      dailyBudgetUsd: values.dailyBudgetUsd,
      peopleCount: values.peopleCount,
      dietaryPreference: values.dietaryPreference,
      existingIngredients: parseIngredientText(values.pantryText),
      cookingSkillLevel: values.cookingSkillLevel,
    });
  };

  return (
    <section className={styles.card} aria-labelledby="planner-form-title">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Plan Inputs</p>
          <h2 id="planner-form-title">Build today&apos;s cooking game plan</h2>
        </div>
        <p className={styles.helper}>All values stay in your current anonymous session.</p>
      </div>

      <form className={styles.form} onSubmit={form.handleSubmit(submitHandler)} noValidate>
        <div className={styles.grid}>
          <Field
            error={form.formState.errors.availableCookingTimeMinutes?.message}
            htmlFor="availableCookingTimeMinutes"
            hint="5 to 240 minutes"
            label="Available cooking time"
          >
            <input
              id="availableCookingTimeMinutes"
              type="number"
              min={5}
              max={240}
              step={5}
              {...form.register("availableCookingTimeMinutes", { valueAsNumber: true })}
              aria-invalid={Boolean(form.formState.errors.availableCookingTimeMinutes)}
            />
          </Field>

          <Field error={form.formState.errors.dailyBudgetUsd?.message} htmlFor="dailyBudgetUsd" hint="USD" label="Daily budget">
            <input
              id="dailyBudgetUsd"
              type="number"
              min={0}
              max={500}
              step={0.5}
              {...form.register("dailyBudgetUsd", { valueAsNumber: true })}
              aria-invalid={Boolean(form.formState.errors.dailyBudgetUsd)}
            />
          </Field>

          <Field error={form.formState.errors.peopleCount?.message} htmlFor="peopleCount" hint="1 to 20 people" label="Number of people">
            <input
              id="peopleCount"
              type="number"
              min={1}
              max={20}
              step={1}
              {...form.register("peopleCount", { valueAsNumber: true })}
              aria-invalid={Boolean(form.formState.errors.peopleCount)}
            />
          </Field>
        </div>

        <fieldset className={styles.fieldset}>
          <legend>Dietary preference</legend>
          <div className={styles.choiceGrid}>
            {DIETARY_PREFERENCES.map((preference) => (
              <label className={styles.choiceCard} key={preference}>
                <input type="radio" value={preference} {...form.register("dietaryPreference")} />
                <span>{preference}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend>Cooking skill level</legend>
          <div className={styles.choiceGrid}>
            {COOKING_SKILL_LEVELS.map((skill) => (
              <label className={styles.choiceCard} key={skill}>
                <input type="radio" value={skill} {...form.register("cookingSkillLevel")} />
                <span>{skill}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field
          error={form.formState.errors.pantryText?.message}
          htmlFor="pantryText"
          hint="Comma or newline separated. Example: rice, tomato, tofu"
          label="Existing ingredients at home"
        >
          <textarea
            id="pantryText"
            rows={5}
            {...form.register("pantryText")}
            aria-invalid={Boolean(form.formState.errors.pantryText)}
          />
        </Field>

        <div className={styles.preview} aria-live="polite">
          <span className={styles.previewLabel}>Pantry preview</span>
          <div className={styles.previewChips}>
            {pantryPreview.length === 0 ? <span className={styles.emptyPreview}>No pantry ingredients added yet.</span> : null}
            {pantryPreview.map((ingredient) => (
              <span className={styles.previewChip} key={ingredient}>
                {ingredient}
              </span>
            ))}
          </div>
        </div>

        <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Generating Plan..." : "Generate Cooking Plan"}
        </button>
      </form>
    </section>
  );
}

function toFormValues(values: CookingPlanRequest): PlanFormValues {
  return {
    availableCookingTimeMinutes: values.availableCookingTimeMinutes,
    dailyBudgetUsd: values.dailyBudgetUsd,
    peopleCount: values.peopleCount,
    dietaryPreference: values.dietaryPreference,
    cookingSkillLevel: values.cookingSkillLevel,
    pantryText: toIngredientText(values.existingIngredients),
  };
}

interface FieldProps {
  label: string;
  htmlFor: string;
  hint: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldHeader}>
        <label htmlFor={htmlFor}>{label}</label>
        <span>{hint}</span>
      </div>
      {children}
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
