import * as React from "react";
import Link from "next/link";
import { Breadcrumbs, BreadcrumbItem } from "@/components/layout/Breadcrumbs";
import { AdSlot } from "@/components/ads/AdSlot";
import { FaqAccordion, FaqItem } from "@/components/shared/FaqAccordion";
import { SchemaScript } from "@/components/seo/SchemaScript";
import { ToolGlyph } from "@/components/shared/ToolGlyph";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { TOOLS } from "@/lib/tools-registry";
import { CATEGORY_STYLES } from "@/lib/category-style";
import { cn } from "@/lib/utils";

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
  const breadcrumbs: BreadcrumbItem[] = [{ label: category, href: `/#${categorySlug}` }, { label: title }];
  const tool = TOOLS.find((t) => t.id === toolId);
  const catId = tool?.category ?? (categorySlug as keyof typeof CATEGORY_STYLES);
  const style = CATEGORY_STYLES[catId] ?? CATEGORY_STYLES.developer;

  // Same-category tools first, then other popular ones.
  const relatedTools = [
    ...TOOLS.filter((t) => t.id !== toolId && t.isReady && t.category === catId),
    ...TOOLS.filter((t) => t.id !== toolId && t.isReady && t.category !== catId && t.featured),
  ].slice(0, 5);

  return (
    <div className="pb-8">
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

      {/* Tool hero on the category tint */}
      <div className={cn("border-b border-slate-200/60", style.soft)}>
        <div className="mx-auto max-w-[1240px] px-4 py-3.5 sm:py-6 sm:pb-8 sm:px-6 lg:px-8">
          <Breadcrumbs items={breadcrumbs} />
          <div className="mt-2.5 flex items-start gap-3 sm:mt-5 sm:gap-5">
            {tool && (
              <ToolGlyph
                tool={tool}
                size="md"
                className="h-10 w-10 text-xs rounded-xl sm:h-16 sm:w-16 sm:rounded-[20px] sm:text-lg"
              />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-ink sm:text-4xl lg:text-5xl leading-tight">
                {title}
              </h1>
              <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600 sm:mt-2 sm:text-base sm:text-slate-700">
                {subtitle}
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-2xs sm:mt-3.5 sm:px-3.5 sm:py-1.5 sm:text-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-sec sm:h-4 sm:w-4" />
                Runs in your browser · Files never uploaded
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        {/* Interactive tool */}
        <div className="relative pt-4 sm:pt-6 lg:pt-8">{children}</div>

        <AdSlot slotId={`tool-slot-${toolId}`} format="horizontal-banner" />

        {/* Helpful content */}
        <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-14">
            <section aria-labelledby="how-to">
              <h2 id="how-to" className="font-display text-3xl font-bold tracking-tight text-ink">
                How to use {title}
              </h2>
              <ol className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {howToSteps.map((step, idx) => (
                  <li key={idx} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl font-display text-base font-extrabold text-ink", style.solid)}>
                      {idx + 1}
                    </span>
                    <h3 className="mt-4 text-[17px] font-bold text-ink">{step.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{step.description}</p>
                  </li>
                ))}
              </ol>
            </section>

            {technicalDetails && (
              <section aria-labelledby="details" className="rounded-[28px] bg-slate-100 p-7 sm:p-9">
                <h2 id="details" className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  {technicalDetails.title}
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-slate-700 [&_code]:rounded-md [&_code]:bg-white [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_strong]:text-ink">
                  {technicalDetails.content}
                </div>
              </section>
            )}

            <section aria-labelledby="faq">
              <h2 id="faq" className="font-display text-3xl font-bold tracking-tight text-ink">
                Questions &amp; answers
              </h2>
              <FaqAccordion items={faqs} className="mt-6" />
            </section>
          </div>

          <aside className="space-y-4 lg:pt-[72px]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="px-1 text-sm font-bold text-ink">More tools you&apos;ll like</h2>
              <ul className="mt-3 space-y-1">
                {relatedTools.map((rel) => (
                  <li key={rel.id}>
                    <Link href={`/tools/${rel.slug}`} className="group flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-slate-50">
                      <ToolGlyph tool={rel} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink">{rel.name}</span>
                        <span className="block truncate text-xs text-slate-600">{rel.shortDescription}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
