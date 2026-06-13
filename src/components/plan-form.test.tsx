// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PlanForm } from "@/components/plan-form";
import type { CookingPlanRequest } from "@/lib/cooking-assistant/types";

const defaults: CookingPlanRequest = {
  availableCookingTimeMinutes: 30,
  dailyBudgetUsd: 20,
  peopleCount: 2,
  dietaryPreference: "Vegetarian",
  existingIngredients: ["rice", "tomato"],
  cookingSkillLevel: "Beginner",
};

describe("PlanForm", () => {
  it("renders accessible labeled controls and submits parsed ingredients", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<PlanForm initialValues={defaults} isSubmitting={false} onSubmit={onSubmit} />);

    expect(screen.getByLabelText(/Available cooking time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Daily budget/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Number of people/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Existing ingredients at home/i)).toBeInTheDocument();

    await user.tab();
    expect(screen.getByLabelText(/Available cooking time/i)).toHaveFocus();

    await user.clear(screen.getByLabelText(/Existing ingredients at home/i));
    await user.type(screen.getByLabelText(/Existing ingredients at home/i), "rice, tofu\nspinach");
    await user.click(screen.getByRole("button", { name: /Generate Cooking Plan/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      availableCookingTimeMinutes: 30,
      dailyBudgetUsd: 20,
      peopleCount: 2,
      dietaryPreference: "Vegetarian",
      existingIngredients: ["rice", "tofu", "spinach"],
      cookingSkillLevel: "Beginner",
    });
  });
});
