export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatMacro(grams: number): string {
  return `${Math.round(grams)}g`;
}

export function parseIngredientText(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function toIngredientText(values: string[]): string {
  return values.join(", ");
}
