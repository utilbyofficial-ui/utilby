import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Disclaimer – Utilby Calculations & Utilities",
  description:
    "Disclaimer regarding calculation results, password generation, and third-party advertising on Utilby.",
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Breadcrumbs items={[{ label: "Disclaimer" }]} />

      <div className="mt-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-800">
          <AlertCircle className="h-4 w-4 text-slate-600" />
          General Productivity Notice
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Disclaimer
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: October 2026
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-10 shadow-soft">
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-700">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
              1. Informational & Educational Use Only
            </h2>
            <p className="mt-3">
              All tools, calculators, text analyzers, formatting utilities, and password generators provided on Utilby are intended for general productivity, educational, and workflow assistance. They do not constitute certified financial, legal, cryptographic, or investment advice.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-8">
            <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
              2. Accuracy of Calculations
            </h2>
            <p className="mt-3">
              While our algorithms and mathematical formulas are rigorously tested against automated test suites, floating-point rounding or edge cases may occasionally occur. Users are advised to independently verify critical business accounting, tax calculations, or high-stakes numbers.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-8">
            <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
              3. Password Storage & Management
            </h2>
            <p className="mt-3">
              Our password generator uses the browser&apos;s cryptographically secure pseudo-random number generator (window.crypto). However, the ultimate security of your accounts depends on how you store and handle credentials. Utilby never saves passwords and cannot retrieve lost or forgotten passwords.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-8">
            <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
              4. External Links & Display Advertising
            </h2>
            <p className="mt-3">
              Utilby may include links to external resources or display advertisements (via Google AdSense). We do not control, endorse, or assume responsibility for the content, privacy practices, or products offered by external third-party sites.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
