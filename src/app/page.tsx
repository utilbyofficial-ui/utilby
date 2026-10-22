import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TOOLS, CATEGORIES } from "@/lib/tools-registry";
import { CATEGORY_STYLES, CATEGORY_ORDER, POPULAR_TOOL_IDS } from "@/lib/category-style";
import { ToolGlyph, CategoryGlyph } from "@/components/shared/ToolGlyph";
import { HeroSearch } from "@/components/home/HeroSearch";
import { cn } from "@/lib/utils";

const QUICK = ["pdf-merger", "image-compressor", "jpg-to-pdf", "qr-code-generator", "split-pdf"];

const CATEGORY_BLURB: Record<string, string> = {
  pdf: "Merge, split, organize and convert",
  image: "Compress and resize photos",
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
          15 free browser tools · No sign-up
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

      {/* Toolboxes */}
      <section aria-labelledby="toolboxes" className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8">
        <h2 id="toolboxes" className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Pick a toolbox
        </h2>
        <div className="stagger mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {categories.map((c) => {
            const count = ready.filter((t) => t.category === c.id).length;
            const style = CATEGORY_STYLES[c.id];
            return (
              <Link
                key={c.id}
                href={`#${c.id}`}
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

      {/* Most loved */}
      <section id="popular-tools" aria-labelledby="popular" className="mx-auto max-w-[1240px] scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="popular" className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Most loved
          </h2>
          <Link href="#all-tools" className="text-[15px] font-semibold text-ink underline-offset-4 hover:underline">
            See all {ready.length} tools →
          </Link>
        </div>
        <div className="stagger mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((t) => (
            <ToolCard key={t.id} tool={t} />
          ))}
        </div>
      </section>

      {/* All tools by category */}
      <section id="all-tools" aria-labelledby="all" className="scroll-mt-20 bg-slate-100/70 py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <h2 id="all" className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Every tool
          </h2>
          <p className="mt-2 text-[15px] text-slate-600">Grouped by toolbox. New tools are added regularly.</p>
          <div className="mt-10 space-y-12">
            {categories.map((c) => {
              const tools = TOOLS.filter((t) => t.category === c.id);
              if (!tools.length) return null;
              return (
                <div key={c.id} id={c.id} className="scroll-mt-24">
                  <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <CategoryGlyph category={c.id} size="sm" />
                    <h3 className="font-display text-2xl font-bold tracking-tight text-ink">{c.name}</h3>
                    <span className="text-sm text-slate-600">· {c.description}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {tools.map((t) => (
                      <ToolCard key={t.id} tool={t} compact />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Promise */}
      <section aria-labelledby="promise" className="mx-auto max-w-[1240px] px-4 pt-20 sm:px-6 lg:px-8">
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

function ToolCard({ tool, compact = false }: { tool: (typeof TOOLS)[number]; compact?: boolean }) {
  const body = (
    <>
      <ToolGlyph tool={tool} size={compact ? "sm" : "md"} />
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2 text-[17px] font-bold text-ink">
          {tool.name}
          {!tool.isReady && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Coming soon</span>}
        </span>
        <span className="mt-1 block text-sm leading-snug text-slate-600">{tool.shortDescription}</span>
      </span>
    </>
  );
  const cls = cn(
    "flex items-start gap-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-soft transition-all duration-200",
    tool.isReady ? "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lift" : "opacity-70"
  );
  return tool.isReady ? (
    <Link href={`/tools/${tool.slug}`} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls} aria-disabled="true">
      {body}
    </div>
  );
}
