import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ShieldCheck, Zap, Globe, Heart, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us – 100% Free & In-Browser Utilities | Utilby",
  description:
    "Learn about Utilby: our mission to build a fast, secure, free, and privacy-first online utility tools ecosystem for everyone.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Breadcrumbs items={[{ label: "About" }]} />

      {/* Hero Header */}
      <div className="mt-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-sec-soft px-3.5 py-1.5 text-xs font-semibold text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-sec" />
          Client-Side Privacy Mission
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
          The friendly toolbox for everyday files
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Utilby was built on a simple conviction: everyday digital tasks like merging PDFs, resizing photos, formatting JSON, and generating passwords should be instant, free, and completely private.
        </p>
      </div>

      {/* Core Highlights */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-sec-soft p-6 sm:p-7">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-xs">
            <ShieldCheck className="h-6 w-6 text-emerald-700" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-ink sm:text-xl">
            100% Client-Side Privacy
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Your files and texts are never sent to remote servers. All calculations and transformations execute directly in your device&apos;s web browser.
          </p>
        </div>

        <div className="rounded-3xl bg-sun-soft p-6 sm:p-7">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-xs">
            <Zap className="h-6 w-6 text-amber-700" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-ink sm:text-xl">
            Instant & No Queue
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            No waiting in cloud conversion queues or artificial countdowns. Operations complete as fast as your device&apos;s CPU and memory can run them.
          </p>
        </div>

        <div className="rounded-3xl bg-dev-soft p-6 sm:p-7">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-xs">
            <Heart className="h-6 w-6 text-violet-700" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-ink sm:text-xl">
            Free Forever, No Sign-up
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            No subscription paywalls, watermarks, or account creation forms. Open any tool and get your work done immediately.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-10 rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-10 shadow-soft">
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-700">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              Why We Built Utilby
            </h2>
            <p className="mt-3">
              Traditional online converters and utility websites often upload sensitive documents, contracts, photos, and developer code to remote cloud servers. This exposes users to data harvesting, server downtime, and paywalls.
            </p>
            <p className="mt-3">
              Utilby was created to prove that modern Web APIs, WebAssembly, and client-side JavaScript can run full-fledged PDF operations, image processing, cryptography, and code parsing directly in the user&apos;s browser tab without risking confidential data.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-8">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              How We Keep It Free
            </h2>
            <p className="mt-3">
              We believe basic digital utilities should be universal and accessible to everyone worldwide. Utilby is sustained through non-intrusive, privacy-compliant display advertising.
            </p>
            <p className="mt-3">
              Ads are clearly labeled, positioned away from interactive tool canvases, and never interrupt your workflow. We do not sell user data because we never collect it in the first place.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">
                Ready to explore?
              </h3>
              <p className="text-sm text-slate-600">
                Browse our 15+ utilities across PDF, Image, Developer, Text, and Calculators.
              </p>
            </div>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors shrink-0"
            >
              Explore all tools
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
