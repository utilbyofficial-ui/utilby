import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TOOLS, CATEGORIES } from "@/lib/tools-registry";
import { CATEGORY_STYLES, CATEGORY_ORDER, POPULAR_TOOL_IDS } from "@/lib/category-style";
import { CATEGORY_LANDING_PAGES } from "@/lib/category-landing";
import { CategoryGlyph } from "@/components/shared/ToolGlyph";
import { HeroSearch } from "@/components/home/HeroSearch";
import { ToolCard } from "@/components/shared/ToolCard";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const QUICK = ["pdf-merger", "image-compressor", "heic-to-jpg", "jpg-to-pdf", "qr-code-generator", "split-pdf"];

const CATEGORY_BLURB: Record<string, string> = {
  pdf: "Merge, split, organize and convert",
  image: "Convert, compress and resize photos",
  text: "Count words, change case",
  developer: "JSON and QR codes",
  security: "Strong, random passwords",
  calculators: "Percentages made easy",
};

export default function HomePage() {
  const ready = TOOLS.filter((t) => t.isReady);
  const featured = POPULAR_TOOL_IDS.map((id) => ready.find((t) => t.id === id)).filter((t): t is (typeof TOOLS)[number] => !!t);
  const categories = CATEGORY_ORDER.map((id) => CATEGORIES.find((c) => c.id === id)!).filter(Boolean);
  const quick = QUICK.map((id) => TOOLS.find((t) => t.id === id)).filter((t): t is (typeof TOOLS)[number] => !!t && t.isReady);

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-[1240px] px-4 pb-12 pt-14 text-center sm:px-6 sm:pt-20 lg:px-8">
        <p className="animate-fade-up inline-flex items-center gap-2 rounded-full bg-sec-soft px-4 py-2 text-sm font-semibold text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-sec" />
          {ready.length} free browser tools · No sign-up
        </p>
        <h1 className="animate-fade-up mx-auto mt-6 max-w-[900px] font-display text-[44px] font-extrabold leading-[1.02] tracking-[-0.035em] text-ink sm:text-[64px] lg:text-[84px]">
          The friendly toolbox for{" "}
          <span className="whitespace-nowrap rounded-2xl bg-sun px-3 sm:rounded-[20px]">everyday</span> files
        </h1>
        <p className="animate-fade-up mx-auto mt-6 max-w-[620px] text-lg leading-relaxed text-slate-600 sm:text-[19px]">
          Merge PDFs, shrink photos, make QR codes and more — free, instant, and private. No sign-up needed.
        </p>
        <HeroSearch />
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {quick.map((t) => (
            <Link
              key={t.id}
              href={`/tools/${t.slug}`}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              {t.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Popular tools are placed near the top so visitors can start without browsing every toolbox. */}
      <section id="popular-tools" aria-labelledby="popular" className="mx-auto max-w-[1240px] scroll-mt-20 px-4 pb-10 pt-2 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="popular" className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Popular tools
          </h2>
          <Link href="/tools" className="text-[15px] font-semibold text-ink underline-offset-4 hover:underline">
            See all {ready.length} tools →
          </Link>
        </div>
        <div className="stagger mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.slice(0, 4).map((t) => (
            <ToolCard key={t.id} tool={t} />
          ))}
        </div>
      </section>

      {/* Toolboxes */}
      <section id="all-tools" aria-labelledby="toolboxes" className="mx-auto max-w-[1240px] scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8">
        <h2 id="toolboxes" className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Pick a toolbox
        </h2>
        <div className="stagger mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {categories.map((c) => {
            const count = ready.filter((t) => t.category === c.id).length;
            const style = CATEGORY_STYLES[c.id];
            const landing = CATEGORY_LANDING_PAGES[c.id as keyof typeof CATEGORY_LANDING_PAGES];
            const href = landing ? `/${landing.slug}` : `/#${c.id}`;
            return (
              <Link
                key={c.id}
                href={href}
                className={cn(
                  "group flex min-h-[150px] flex-col justify-between gap-6 rounded-[24px] p-4 transition-transform duration-200 hover:-translate-y-1 sm:min-h-[180px] sm:gap-10 sm:rounded-[28px] sm:p-6",
                  style.soft
                )}
              >
                <span className="flex items-start justify-between">
                  <CategoryGlyph category={c.id} className="h-12 w-12 rounded-2xl text-[13px] sm:h-14 sm:w-14 sm:rounded-[18px] sm:text-base" />
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink sm:px-3 sm:py-1.5 sm:text-sm">
                    {count} tool{count === 1 ? "" : "s"}
                  </span>
                </span>
                <span>
                  <span className="flex items-center gap-2 font-display text-xl font-bold leading-tight tracking-tight text-ink sm:text-[26px]">
                    {c.name}
                    <ArrowRight className="h-5 w-5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </span>
                  <span className="mt-1.5 block text-sm text-slate-700 sm:text-[15px]">{CATEGORY_BLURB[c.id]}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Promise */}
      <section aria-labelledby="promise" className="mx-auto max-w-[1240px] px-4 pt-12 sm:px-6 lg:px-8">
        <h2 id="promise" className="sr-only">
          Why Utilby
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-sec-soft p-7">
            <h3 className="font-display text-[22px] font-bold text-ink">100% private</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
              Everything runs in your browser. Disconnect from the internet after the page loads — the tools keep working.
            </p>
          </div>
          <div className="rounded-3xl bg-sun-soft p-7">
            <h3 className="font-display text-[22px] font-bold text-ink">Free forever</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-700">No accounts, no watermarks, no daily limits. Open a tool and get it done.</p>
          </div>
          <div className="rounded-3xl bg-dev-soft p-7">
            <h3 className="font-display text-[22px] font-bold text-ink">Super fast</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-700">No upload, no queue. Results appear as fast as your device can make them.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
