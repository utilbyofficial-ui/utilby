import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "Terms of Service | Utilby Network",
  description:
    "Terms of Service governing the use of free online utility tools provided by Utilby Network.",
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Terms of Service" }]} />

      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="mt-2 text-xs text-slate-400">
          Last updated: October 2026
        </p>

        <div className="prose prose-slate max-w-none dark:prose-invert space-y-6 mt-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            By accessing or using the website located at <strong>Utilby</strong> (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access or use the Service.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. License & Permitted Use
          </h2>
          <p>
            Utilby grants you a personal, non-exclusive, non-transferable, revocable license to access and use our suite of utility tools strictly for lawful personal, educational, and business productivity purposes.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. Prohibited Conduct
          </h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Attempt to reverse engineer, disrupt, or launch denial-of-service (DoS) attacks against our infrastructure.</li>
            <li>Use automated scrapers or bots that degrade the performance of the Service for other visitors.</li>
            <li>Attempt to bypass or tamper with security headers or content security policies.</li>
          </ul>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Disclaimer of Warranties
          </h2>
          <p>
            The tools and calculations on Utilby are provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied. While we strive for mathematical and algorithmic precision, we make no guarantees regarding uninterrupted availability, error-free operation, or suitability for critical financial, legal, or mission-critical systems.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Limitation of Liability
          </h2>
          <p>
            In no event shall Utilby, its creators, or operators be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our tools or reliance on calculated outcomes.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            5. Governing Law
          </h2>
          <p>
            These terms shall be interpreted in accordance with standard international internet governance and applicable laws.
          </p>
        </div>
      </div>
    </div>
  );
}
