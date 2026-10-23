import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ShieldCheck, Lock, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy-policy" },
  title: "Privacy Policy – 100% In-Browser Privacy Guarantee | Utilby",
  description:
    "Privacy Policy for Utilby: our commitment to client-side processing, zero server storage, and strict privacy protections.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Breadcrumbs items={[{ label: "Privacy Policy" }]} />

      <div className="mt-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-sec-soft px-3.5 py-1.5 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Zero Data Collection Policy
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: October 2026
        </p>
      </div>

      {/* Key Takeaway Callout */}
      <div className="mt-8 rounded-3xl bg-sec-soft p-6 sm:p-7 border border-emerald-200/60">
        <div className="flex items-start gap-3">
          <Lock className="h-6 w-6 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              The Utilby Privacy Promise in Brief
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              When you use Utilby to merge PDFs, compress images, calculate percentages, or generate passwords, <strong>your files and data never touch our servers</strong>. All computation takes place in your device&apos;s own web browser.
            </p>
          </div>
        </div>
      </div>

      {/* Main Policy Content */}
      <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-10 shadow-soft">
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-700">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
              1. 100% In-Browser Execution
            </h2>
            <p className="mt-3">
              Utilby operates on a client-side architecture. When you upload or drag files into any workspace (e.g. PDF merger, image compressor):
            </p>
            <ul className="mt-3 space-y-2">
              {[
                "Files remain stored only in your browser's temporary memory (RAM).",
                "Processing is performed via WebAssembly, JavaScript, and native Web APIs.",
                "No documents, texts, or cryptographic secrets are transmitted over the internet to Utilby servers.",
                "You can disconnect your internet after loading a tool page and it will continue functioning.",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-1" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-100 pt-8">
            <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
              2. Technical & Analytics Information
            </h2>
            <p className="mt-3">
              Like virtually all web properties, our hosting provider (Cloudflare) records basic non-identifiable network telemetry such as anonymous page view counts, broad geographic country, browser type, and HTTP request headers.
            </p>
            <p className="mt-3">
              This telemetry contains <strong>no personal information</strong>, uses <strong>no tracking cookies</strong>, and is strictly used to maintain uptime, prevent denial-of-service abuse, and optimize content delivery.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-8">
            <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
              3. Display Advertising
            </h2>
            <p className="mt-3">
              To keep our tools free without subscription fees, we display advertisements via partners such as Google AdSense. These advertising partners may use cookies or web beacons in accordance with their privacy policies to serve relevant advertisements.
            </p>
            <p className="mt-3">
              You can manage personalized advertising preferences anytime through your browser settings or Google&apos;s Ads Settings page (adssettings.google.com).
            </p>
          </div>

          <div className="border-t border-slate-100 pt-8">
            <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
              4. Contact & Inquiries
            </h2>
            <p className="mt-3">
              If you have any questions about this Privacy Policy or our client-side architecture, please contact us at:{" "}
              <a href="mailto:support@utilby.com" className="font-bold text-ink underline-offset-4 hover:underline">
                support@utilby.com
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
