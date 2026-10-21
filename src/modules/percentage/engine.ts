export function calculatePercentageOf(percent: number, total: number): { result: number; formula: string } {
  if (isNaN(percent) || isNaN(total)) {
    return { result: 0, formula: "" };
  }
  const result = (percent / 100) * total;
  return {
    result: Number(result.toFixed(4)),
    formula: `(${percent} ÷ 100) × ${total} = ${Number(result.toFixed(4))}`,
  };
}

export function calculateWhatPercentageIs(part: number, whole: number): { result: number; formula: string } | { error: string } {
  if (isNaN(part) || isNaN(whole)) {
    return { result: 0, formula: "" };
  }
  if (whole === 0) {
    return { error: "Division by zero is not allowed. Total cannot be 0." };
  }
  const result = (part / whole) * 100;
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
  if (isNaN(initialValue) || isNaN(finalValue)) {
    return {
      percentChange: 0,
      type: "no-change",
      difference: 0,
      formula: "",
    };
  }
  if (initialValue === 0) {
    return { error: "Initial value cannot be 0 for percentage change calculation." };
  }

  const difference = finalValue - initialValue;
  const percentChange = (difference / Math.abs(initialValue)) * 100;
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

export function calculateDiscount(originalPrice: number, discountPercent: number): DiscountResult {
  if (isNaN(originalPrice) || isNaN(discountPercent) || originalPrice < 0) {
    return { discountAmount: 0, finalPrice: 0, savingsFormula: "" };
  }
  const discountAmount = (discountPercent / 100) * originalPrice;
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  return {
    discountAmount: Number(discountAmount.toFixed(2)),
    finalPrice: Number(finalPrice.toFixed(2)),
    savingsFormula: `Save: ($${originalPrice} × ${discountPercent}%) = $${discountAmount.toFixed(2)} | Final: $${finalPrice.toFixed(2)}`,
  };
}
