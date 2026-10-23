import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Mail, Clock, Shield, MessageSquare, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  title: "Contact & Support – Get in Touch | Utilby",
  description:
    "Contact the Utilby engineering team for support, feature suggestions, bug reports, and business inquiries.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Breadcrumbs items={[{ label: "Contact" }]} />

      {/* Hero Header */}
      <div className="mt-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-sun-soft px-3.5 py-1.5 text-xs font-semibold text-amber-900">
          <span className="h-2 w-2 rounded-full bg-sun" />
          Support & Feedback
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Get in touch with the team
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Have an idea for a new utility tool? Found an edge-case bug? We read every message and respond promptly.
        </p>
      </div>

      {/* Contact Cards */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-soft">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-dev-soft">
            <Mail className="h-6 w-6 text-violet-700" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-ink sm:text-xl">
            Email Support
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            For general support, feedback, and partnership questions:
          </p>
          <a
            href="mailto:support@utilby.com"
            className="mt-4 inline-flex items-center gap-1.5 font-display text-sm font-bold text-ink underline-offset-4 hover:underline"
          >
            support@utilby.com
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-soft">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sec-soft">
            <Clock className="h-6 w-6 text-emerald-700" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-ink sm:text-xl">
            Response Time
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Our engineering team typically reviews inquiries and replies within <strong>24 to 48 hours</strong>.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-soft">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sun-soft">
            <Shield className="h-6 w-6 text-amber-700" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-ink sm:text-xl">
            Bug Reports
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Encountered an issue? Please include your browser version, OS, and sample steps to reproduce.
          </p>
        </div>
      </div>

      {/* Direct Contact Box */}
      <div className="mt-10 rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-10 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              Send an email directly
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-xl">
              Click the button below to launch your email client with our official support address pre-filled.
            </p>
          </div>
          <a
            href="mailto:support@utilby.com?subject=Utilby%20Feedback%20or%20Support"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <Mail className="h-4 w-4" />
            Email support@utilby.com
          </a>
        </div>
      </div>
    </div>
  );
}
