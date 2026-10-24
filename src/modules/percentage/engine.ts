export function calculatePercentageOf(percent: number, total: number): { result: number; formula: string } | { error: string } {
  if (!Number.isFinite(percent) || !Number.isFinite(total)) {
    return { error: "Enter finite numbers to calculate a percentage." };
  }
  const result = (percent / 100) * total;
  if (!Number.isFinite(result)) return { error: "The result is outside the supported numeric range." };
  return {
    result: Number(result.toFixed(4)),
    formula: `(${percent} ÷ 100) × ${total} = ${Number(result.toFixed(4))}`,
  };
}

export function calculateWhatPercentageIs(part: number, whole: number): { result: number; formula: string } | { error: string } {
  if (!Number.isFinite(part) || !Number.isFinite(whole)) {
    return { error: "Enter finite numbers to calculate a percentage." };
  }
  if (whole === 0) {
    return { error: "Division by zero is not allowed. Total cannot be 0." };
  }
  const result = (part / whole) * 100;
  if (!Number.isFinite(result)) return { error: "The result is outside the supported numeric range." };
  return {
    result: Number(result.toFixed(4)),
    formula: `(${part} ÷ ${whole}) × 100 = ${Number(result.toFixed(4))}%`,
  };
}

export interface PercentageChangeResult {
  percentChange: number;
  type: "increase" | "decrease" | "no-change";
  difference: number;
  formula: string;
}

export function calculatePercentageChange(initialValue: number, finalValue: number): PercentageChangeResult | { error: string } {
  if (!Number.isFinite(initialValue) || !Number.isFinite(finalValue)) {
    return { error: "Enter finite numbers to calculate percentage change." };
  }
  if (initialValue === 0) {
    return { error: "Initial value cannot be 0 for percentage change calculation." };
  }

  const difference = finalValue - initialValue;
  const percentChange = (difference / Math.abs(initialValue)) * 100;
  if (!Number.isFinite(difference) || !Number.isFinite(percentChange)) {
    return { error: "The result is outside the supported numeric range." };
  }
  const type = difference > 0 ? "increase" : difference < 0 ? "decrease" : "no-change";

  return {
    percentChange: Math.abs(Number(percentChange.toFixed(4))),
    type,
    difference: Number(difference.toFixed(4)),
    formula: `((${finalValue} - ${initialValue}) ÷ |${initialValue}|) × 100 = ${Number(percentChange.toFixed(4))}%`,
  };
}

export interface DiscountResult {
  discountAmount: number;
  finalPrice: number;
  savingsFormula: string;
}

export function calculateDiscount(originalPrice: number, discountPercent: number): DiscountResult | { error: string } {
  if (!Number.isFinite(originalPrice) || !Number.isFinite(discountPercent) || originalPrice < 0 || discountPercent < 0 || discountPercent > 100) {
    return { error: "Enter a non-negative price and a discount between 0% and 100%." };
  }
  const discountAmount = (discountPercent / 100) * originalPrice;
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  return {
    discountAmount: Number(discountAmount.toFixed(2)),
    finalPrice: Number(finalPrice.toFixed(2)),
    savingsFormula: `Save: ($${originalPrice} × ${discountPercent}%) = $${discountAmount.toFixed(2)} | Final: $${finalPrice.toFixed(2)}`,
  };
}
