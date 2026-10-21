import * as React from "react";
import Link from "next/link";
import { Breadcrumbs, BreadcrumbItem } from "@/components/layout/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { AdSlot } from "@/components/ads/AdSlot";
import { FaqAccordion, FaqItem } from "@/components/shared/FaqAccordion";
import { SchemaScript } from "@/components/seo/SchemaScript";
import { Shield, Sparkles, ArrowRight } from "lucide-react";
import { TOOLS } from "@/lib/tools-registry";

interface ToolLayoutProps {
  toolId: string;
  title: string;
  subtitle: string;
  category: string;
  categorySlug: string;
  children: React.ReactNode;
  howToSteps: { step: string; title: string; description: string }[];
  technicalDetails?: { title: string; content: React.ReactNode };
  faqs: FaqItem[];
}

export function ToolLayout({
  toolId,
  title,
  subtitle,
  category,
  categorySlug,
  children,
  howToSteps,
  technicalDetails,
  faqs,
}: ToolLayoutProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: category, href: `/#${categorySlug}` },
    { label: title },
  ];

  const relatedTools = TOOLS.filter((t) => t.id !== toolId && t.isReady).slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 dark:bg-slate-950">
      <SchemaScript
        toolName={title}
        description={subtitle}
        url={`https://utilby.com/tools/${toolId}`}
        category={category}
        faqs={faqs}
        breadcrumbs={[
          { name: "Home", url: "https://utilby.com" },
          { name: category, url: `https://utilby.com/#${categorySlug}` },
          { name: title, url: `https://utilby.com/tools/${toolId}` },
        ]}
      />

      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} />

        {/* Tool Header Section */}
        <div className="mb-8 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
            <Badge variant="default">{category}</Badge>
            <Badge variant="success" className="gap-1">
              <Shield className="h-3 w-3" />
              100% Client-Side • Zero Data Storage
            </Badge>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base dark:text-slate-400 max-w-3xl">
            {subtitle}
          </p>
        </div>

        {/* Interactive Tool Sandbox (Above the Fold) */}
        <div className="relative mb-8">{children}</div>

        {/* CLS-safe non-intrusive AdSlot */}
        <AdSlot slotId={`tool-slot-${toolId}`} format="horizontal-banner" />

        {/* Comprehensive SEO Content Section (Helpful Content) */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-10">
            {/* How-To Guide */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                How to Use the {title}
              </h2>
              <div className="space-y-4">
                {howToSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {step.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Technical Explanation / Formulas */}
            {technicalDetails && (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {technicalDetails.title}
                </h2>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-3">
                  {technicalDetails.content}
                </div>
              </section>
            )}

            {/* Frequently Asked Questions */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                Frequently Asked Questions
              </h2>
              <FaqAccordion items={faqs} />
            </section>
          </div>

          {/* Sidebar Area: Related Tools & Privacy Guarantee */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Related Free Utilities
              </h3>
              <div className="space-y-3">
                {relatedTools.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/tools/${rel.slug}`}
                    className="group block rounded-xl border border-slate-100 p-3 transition-colors hover:border-indigo-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-slate-200">
                        {rel.name}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                      {rel.shortDescription}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Privacy Highlight Box */}
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider mb-2">
                <Shield className="h-4 w-4" />
                Browser Privacy Promise
              </div>
              <p className="text-xs text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed">
                This tool processes your inputs strictly using modern JavaScript inside your local web browser. None of your data, text, or calculations are transferred or logged to any remote server.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
