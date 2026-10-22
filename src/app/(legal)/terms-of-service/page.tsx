import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { FileText, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service – Utilby Free Utility Tools",
  description:
    "Terms of Service governing the use of free online utility tools provided by Utilby.",
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Breadcrumbs items={[{ label: "Terms of Service" }]} />

      <div className="mt-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-800">
          <FileText className="h-4 w-4 text-slate-600" />
          Standard Usage Terms
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: October 2026
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-10 shadow-soft">
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-700">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
              1. Agreement to Terms
            </h2>
            <p className="mt-3">
              By accessing and using Utilby (utilby.com), you agree to be bound by these Terms of Service. If you do not agree to all terms and conditions stated here, you must not use our website or tools.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-8">
            <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
              2. Permitted Use & Free License
            </h2>
            <p className="mt-3">
              Utilby grants you a worldwide, revocable, non-exclusive, royalty-free license to use our tools for lawful personal, academic, and commercial purposes. You are welcome to format, convert, calculate, and modify your files without charge.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-8">
            <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
              3. Prohibited Activities
            </h2>
            <p className="mt-3">When using Utilby, you agree not to:</p>
            <ul className="mt-3 space-y-2">
              {[
                "Attempt to compromise or disrupt our web servers, edge CDN, or network infrastructure.",
                "Use automated scripts to generate excessive traffic that impacts availability for other visitors.",
                "Frame or mirror the site in a manner that removes attribution or confuses users.",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-400 shrink-0 mt-1" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-100 pt-8">
            <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
              4. Disclaimer of Warranty
            </h2>
            <p className="mt-3">
              Utilby is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, either express or implied. While we strive for absolute calculation precision and robust client-side performance, we do not warrant that operation will be uninterrupted or error-free.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-8">
            <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
              5. Governing Law
            </h2>
            <p className="mt-3">
              These terms shall be governed by and interpreted in accordance with applicable standard legal frameworks without regard to conflict of law provisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
