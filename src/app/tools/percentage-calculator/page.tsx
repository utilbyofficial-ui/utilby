import type { Metadata } from "next";
import { ToolLayout } from "@/components/shared/ToolLayout";
import { PercentageCalculatorTool } from "@/modules/percentage/PercentageCalculatorTool";

export const metadata: Metadata = {
  title: "Percentage Calculator – Free Percentage Calculator with Formulas | Utilby",
  description:
    "Fast and accurate percentage calculator: find X% of Y, calculate percentage change, percentage difference, and retail discount savings.",
  keywords: [
    "percentage calculator",
    "calculate percentage",
    "percentage change calculator",
    "discount calculator",
    "percentage increase decrease",
    "what is x percent of y",
  ],
  alternates: {
    canonical: "/tools/percentage-calculator",
  },
  openGraph: {
    title: "Percentage Calculator – Free Percentage Calculator with Formulas | Utilby",
    description:
      "Fast and accurate percentage calculator: find X% of Y, calculate percentage change, percentage difference, and retail discount savings.",
    url: "https://utilby.com/tools/percentage-calculator",
    type: "website",
    images: [{ url: "https://utilby.com/og/tools/percentage-calculator.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://utilby.com/og/tools/percentage-calculator.png"],
  },
};

export default function PercentageCalculatorPage() {
  const howToSteps = [
    {
      step: "1",
      title: "Select Calculation Mode",
      description:
        "Choose between 'What is X% of Y?', 'X is What % of Y?', 'Percentage Change (Increase/Decrease)', or 'Discount & Savings'.",
    },
    {
      step: "2",
      title: "Input Values",
      description:
        "Enter your numbers in the designated input fields. Results compute in real time as you type.",
    },
    {
      step: "3",
      title: "Review Result & Mathematical Formula",
      description:
        "Check the calculated result and review the step-by-step mathematical formula used to obtain the answer.",
    },
  ];

  const technicalDetails = {
    title: "Standard Percentage Formulas & Practical Examples",
    content: (
      <>
        <div className="space-y-2">
          <p>
            <strong>1. Percentage of a Number ($X\%$ of $Y$):</strong>
            <br />
            <code>Formula: (X ÷ 100) × Y</code>
            <br />
            <em>Example: 20% of 150 = (20 ÷ 100) × 150 = 30.</em>
          </p>
          <p>
            <strong>2. Percentage Proportion ($X$ is what $\%$ of $Y$):</strong>
            <br />
            <code>Formula: (X ÷ Y) × 100</code>
            <br />
            <em>Example: 25 is what % of 200 = (25 ÷ 200) × 100 = 12.5%.</em>
          </p>
          <p>
            <strong>3. Percentage Increase / Decrease:</strong>
            <br />
            <code>Formula: ((New Value - Old Value) ÷ |Old Value|) × 100</code>
            <br />
            <em>Example: Price changes from $100 to $130 = ((130 - 100) ÷ 100) × 100 = +30% increase.</em>
          </p>
          <p>
            <strong>4. Discount & Savings:</strong>
            <br />
            <code>Final Price = Original Price - (Original Price × Discount% ÷ 100)</code>
          </p>
        </div>
      </>
    ),
  };

  const faqs = [
    {
      question: "How do you calculate percentage decrease?",
      answer:
        "Subtract the new value from the original value, divide that difference by the original value, and multiply the result by 100. For example, if a price drops from $80 to $60: ((80 - 60) ÷ 80) × 100 = 25% decrease.",
    },
    {
      question: "What happens if the original value is zero in percentage change?",
      answer:
        "Mathematically, percentage change cannot be calculated when the starting value is zero because division by zero is undefined. An increase from 0 to any positive number represents an infinite percentage growth.",
    },
    {
      question: "Can I use negative numbers?",
      answer:
        "Yes, our calculator supports negative inputs for financial growth, stock market loss tracking, and negative temperature variations.",
    },
  ];

  return (
    <ToolLayout
      toolId="percentage-calculator"
      title="Free Online Percentage Calculator"
      subtitle="Solve percentage equations, calculate price discounts, and compute percentage increases or decreases with step-by-step formulas."
      category="Calculators"
      categorySlug="calculators"
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={faqs}
    >
      <PercentageCalculatorTool />
    </ToolLayout>
  );
}
