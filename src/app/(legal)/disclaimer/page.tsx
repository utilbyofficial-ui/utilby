import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "Disclaimer | UtilityBox Network",
  description:
    "Disclaimer regarding calculation results, security password generation, and third-party advertising on UtilityBox Network.",
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Disclaimer" }]} />

      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Disclaimer
        </h1>
        <p className="mt-2 text-xs text-slate-400">
          Last updated: October 2026
        </p>

        <div className="prose prose-slate max-w-none dark:prose-invert space-y-6 mt-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. General Informational Use Only
          </h2>
          <p>
            All utility calculators, statistical analyzers, formatting engines, and password generators provided on UtilityBox are intended exclusively for general productivity, educational, and computational assistance. They do not constitute official financial, legal, cryptographic audit, or investment advice.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. Calculation Accuracy
          </h2>
          <p>
            Although our algorithms and mathematical formulas are rigorously tested through automated test suites, rounding variations or unexpected floating-point edge cases may occur in rare circumstances. Users are advised to double-check critical financial percentages, tax computations, or business accounting numbers independently.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Password Security & Storage
          </h2>
          <p>
            While our password generator uses cryptographically secure pseudo-random number generators (CSPRNG), the ultimate safety of your online accounts depends on how you store and handle generated credentials (e.g., using a reputable password manager, enabling multi-factor authentication, and avoiding public computer exposure). UtilityBox does not save passwords and is not responsible for lost or compromised credentials.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. External Links & Advertisements
          </h2>
          <p>
            Our website may contain links to external sites or third-party advertisements (such as Google AdSense). We do not control, endorse, or assume responsibility for the content, privacy practices, or goods and services offered on external third-party websites.
          </p>
        </div>
      </div>
    </div>
  );
}
