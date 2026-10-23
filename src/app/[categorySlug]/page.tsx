import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  Lock,
  Layers,
} from "lucide-react";
import {
  ALL_CATEGORY_SLUGS,
  getCategoryLandingData,
  CATEGORY_LANDING_PAGES,
} from "@/lib/category-landing";
import { TOOLS, CATEGORIES } from "@/lib/tools-registry";
import { CATEGORY_STYLES, CATEGORY_ORDER } from "@/lib/category-style";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CategoryGlyph, ToolGlyph } from "@/components/shared/ToolGlyph";
import { FaqAccordion } from "@/components/shared/FaqAccordion";
import { AdSlot } from "@/components/ads/AdSlot";
import { CategorySchemaScript } from "@/components/seo/CategorySchemaScript";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ categorySlug: string }>;
}

export function generateStaticParams() {
  return ALL_CATEGORY_SLUGS.map((categorySlug) => ({
    categorySlug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const data = getCategoryLandingData(categorySlug);
  if (!data) return {};

  const canonicalUrl = `https://utilby.com/${data.slug}`;

  return {
    title: data.seoTitle,
    description: data.seoDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: data.seoTitle,
      description: data.seoDescription,
      url: canonicalUrl,
      siteName: "Utilby",
      locale: "en_US",
      type: "website",
      images: [
        {
          url: `https://utilby.com/og/${data.id}-tools.png`,
          width: 1200,
          height: 630,
          alt: `${data.name} – Utilby`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: data.seoTitle,
      description: data.seoDescription,
      images: [`https://utilby.com/og/${data.id}-tools.png`],
    },
  };
}

export default async function CategoryLandingPage({ params }: PageProps) {
  const { categorySlug } = await params;
  const data = getCategoryLandingData(categorySlug);

  if (!data) {
    notFound();
  }

  const categoryId = data.id;
  const style = CATEGORY_STYLES[categoryId] ?? CATEGORY_STYLES.developer;

  // Tools in this category
  const allCategoryTools = TOOLS.filter((t) => t.category === categoryId);
  const readyTools = allCategoryTools.filter((t) => t.isReady);
  const upcomingTools = allCategoryTools.filter((t) => !t.isReady);

  // Other categories for cross-navigation
  const otherCategories = CATEGORY_ORDER.filter((id) => id !== categoryId).map((id) => {
    const landing = CATEGORY_LANDING_PAGES[id];
    const cat = CATEGORIES.find((c) => c.id === id);
    const count = TOOLS.filter((t) => t.category === id && t.isReady).length;
    return {
      id,
      name: cat?.name ?? landing.name,
      slug: landing.slug,
      count,
      style: CATEGORY_STYLES[id],
    };
  });

  return (
    <div className="pb-20">
      {/* Schema.org CollectionPage, ItemList, Breadcrumbs & FAQ */}
      <CategorySchemaScript data={data} tools={allCategoryTools} />

      {/* Hero Header */}
      <section className={cn("border-b border-slate-200/60 transition-colors", style.soft)}>
        <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
          <Breadcrumbs items={[{ label: data.name }]} />

          <div className="mt-6 flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm sm:text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>100% In-Browser · Private & Free · No Server Upload</span>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <CategoryGlyph
                  category={categoryId}
                  size="lg"
                  className="h-14 w-14 rounded-2xl text-lg sm:h-20 sm:w-20 sm:rounded-3xl sm:text-2xl shadow-soft"
                />
                <div>
                  <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl leading-[1.08]">
                    {data.h1}
                  </h1>
                </div>
              </div>

              <p className="mt-4 text-base leading-relaxed text-slate-700 sm:text-lg lg:text-xl">
                {data.subtitle}
              </p>

              {/* Highlight Stats Chips */}
              <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
                {data.highlightStats.map((stat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-xs sm:text-sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    {stat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top AdSlot */}
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <AdSlot slotId={`category-${categoryId}-top`} />
      </div>

      {/* Main Suite Tools Grid */}
      <section className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Available Tools
            </h2>
            <p className="mt-1 text-sm sm:text-base text-slate-600">
              Select a tool below to process files right now directly in your browser.
            </p>
          </div>
          <span className="self-start sm:self-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {readyTools.length} free {readyTools.length === 1 ? "tool" : "tools"}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {readyTools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.slug}`}
              className="group flex flex-col justify-between rounded-[24px] border border-slate-200 bg-white p-6 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lift"
            >
              <div>
                <div className="flex items-center justify-between">
                  <ToolGlyph tool={tool} size="md" />
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    Free
                  </span>
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-ink group-hover:text-indigo-900 transition-colors">
                  {tool.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {tool.shortDescription}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-slate-700">
                <span className="text-slate-500">100% Client-Side</span>
                <span className="flex items-center gap-1.5 font-bold text-ink group-hover:translate-x-0.5 transition-transform">
                  Open Tool
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Coming Soon Roadmap Tools */}
        {upcomingTools.length > 0 && (
          <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <h3 className="font-display text-lg font-bold text-ink sm:text-xl">
                Coming Soon to the {data.name} Suite
              </h3>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              We are actively developing these additions. Like all Utilby tools, they will run 100% locally in your browser.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {upcomingTools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 opacity-80"
                >
                  <ToolGlyph tool={tool} size="sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink">{tool.name}</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        In Development
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{tool.shortDescription}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Why Choose This Suite */}
      <section className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-4xl">
            {data.whyChooseHeading}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Utilby is built around a modern, privacy-first architecture that sets it apart from traditional online converter websites.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {data.whyChoosePoints.map((point, index) => {
            const icons = [
              <Lock key="1" className="h-6 w-6 text-emerald-600" />,
              <Zap key="2" className="h-6 w-6 text-amber-600" />,
              <Layers key="3" className="h-6 w-6 text-indigo-600" />,
            ];
            return (
              <div
                key={index}
                className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-soft transition-transform hover:-translate-y-0.5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 shadow-xs">
                  {icons[index % icons.length]}
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-ink sm:text-xl">
                  {point.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                  {point.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How To Steps Guide */}
      <section className="bg-slate-50/80 border-y border-slate-200/70 py-12 sm:py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Quick Guide
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              How to Use {data.name}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">
              Get your tasks done in four simple steps without registering or waiting in queue.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.howToSteps.map((step) => (
              <div
                key={step.step}
                className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-sm font-bold text-white">
                  {step.step}
                </div>
                <h3 className="mt-3 font-display text-base font-bold text-ink sm:text-lg">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom AdSlot */}
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <AdSlot slotId={`category-${categoryId}-bottom`} />
      </div>

      {/* Frequently Asked Questions */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Common questions about our {data.name.toLowerCase()} and browser-based privacy guarantees.
          </p>
        </div>

        <div className="mt-8">
          <FaqAccordion items={data.faqs} />
        </div>
      </section>

      {/* Cross-Navigation: Other Toolboxes */}
      <section className="mx-auto max-w-[1240px] px-4 pt-8 sm:px-6 lg:px-8">
        <div className="border-t border-slate-200 pt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Explore Other Utilby Toolboxes
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {TOOLS.filter((t) => t.isReady).length} free client-side tools across PDF, Images, Text, Developer utilities, and Calculators.
              </p>
            </div>
            <Link
              href="/tools"
              className="text-sm font-semibold text-ink underline-offset-4 hover:underline"
            >
              Browse all tools →
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
            {otherCategories.map((other) => (
              <Link
                key={other.id}
                href={`/${other.slug}`}
                className={cn(
                  "group flex flex-col justify-between rounded-2xl p-4 transition-transform hover:-translate-y-1 shadow-xs",
                  other.style.soft
                )}
              >
                <div className="flex items-center justify-between">
                  <CategoryGlyph category={other.id} size="sm" />
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                    {other.count}
                  </span>
                </div>
                <div className="mt-4">
                  <span className="block font-display text-sm font-bold text-ink sm:text-base">
                    {other.name}
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-600 group-hover:text-ink">
                    Explore
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
