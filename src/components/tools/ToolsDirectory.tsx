"use client";

import * as React from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { TOOLS, CATEGORIES, type ToolMeta } from "@/lib/tools-registry";
import { CATEGORY_ORDER, CATEGORY_STYLES } from "@/lib/category-style";
import { CATEGORY_LANDING_PAGES } from "@/lib/category-landing";
import { CategoryGlyph } from "@/components/shared/ToolGlyph";
import { ToolCard } from "@/components/shared/ToolCard";
import { cn } from "@/lib/utils";

type CategoryId = ToolMeta["category"];

function matches(t: ToolMeta, q: string) {
  if (!q) return true;
  const s = q.toLowerCase();
  return (
    t.name.toLowerCase().includes(s) ||
    t.shortDescription.toLowerCase().includes(s) ||
    t.categoryName.toLowerCase().includes(s) ||
    t.keywords.some((k) => k.toLowerCase().includes(s))
  );
}

/** Searchable, filterable list of every Utilby tool, grouped by toolbox. */
export function ToolsDirectory() {
  const [query, setQuery] = React.useState("");
  const [cat, setCat] = React.useState<CategoryId | "all">("all");

  // Deep link: /tools?category=pdf or /tools#pdf
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("category");
    const fromHash = window.location.hash.replace("#", "");
    const wanted = (fromQuery || fromHash) as CategoryId;
    if (CATEGORIES.some((c) => c.id === wanted)) setCat(wanted);
    const q = params.get("q");
    if (q) setQuery(q);
  }, []);

  const q = query.trim();
  const categories = CATEGORY_ORDER.map((id) => CATEGORIES.find((c) => c.id === id)!).filter(Boolean);
  const visible = TOOLS.filter((t) => (cat === "all" || t.category === cat) && matches(t, q));
  const readyCount = (id: CategoryId) => TOOLS.filter((t) => t.isReady && t.category === id).length;

  return (
    <div>
      {/* Search + filters */}
      <div className="sticky top-[72px] z-20 -mx-4 bg-white/95 px-4 pb-4 pt-2 backdrop-blur sm:mx-0 sm:px-0">
        <div className="relative">
          <label htmlFor="tools-search" className="sr-only">
            Search tools
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            id="tools-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${TOOLS.filter((t) => t.isReady).length} tools — e.g. “compress”, “pdf to jpg”, “qr”`}
            autoComplete="off"
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-base text-ink shadow-soft placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div role="group" aria-label="Filter by toolbox" className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={cat === "all"} onClick={() => setCat("all")} label="All" count={TOOLS.filter((t) => t.isReady).length} />
          {categories.map((c) => (
            <FilterChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} label={c.name.replace(/ Tools$/, "")} count={readyCount(c.id)} dot={CATEGORY_STYLES[c.id].hex} />
          ))}
        </div>
      </div>

      {/* Results */}
      {visible.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-slate-100 p-10 text-center">
          <p className="font-display text-xl font-bold text-ink">No tools match “{q}”.</p>
          <p className="mt-2 text-sm text-slate-600">
            Try a shorter word like “pdf”, “image” or “text” —{" "}
            <Link href="/contact" className="font-semibold text-ink underline underline-offset-4">
              or tell us which tool you need
            </Link>
            .
          </p>
        </div>
      ) : q ? (
        <div className="mt-6">
          <p className="mb-4 text-sm text-slate-600">
            {visible.length} result{visible.length === 1 ? "" : "s"} for “{q}”
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-14">
          {categories
            .filter((c) => cat === "all" || c.id === cat)
            .map((c) => {
              const tools = visible.filter((t) => t.category === c.id).sort((a, b) => Number(b.isReady) - Number(a.isReady));
              if (!tools.length) return null;
              const landing = CATEGORY_LANDING_PAGES[c.id];
              return (
                <section key={c.id} id={c.id} aria-labelledby={`h-${c.id}`} className="scroll-mt-40">
                  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CategoryGlyph category={c.id} size="md" />
                      <div>
                        <h2 id={`h-${c.id}`} className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                          {c.name}
                        </h2>
                        <p className="text-sm text-slate-600">{c.description}</p>
                      </div>
                    </div>
                    {landing && (
                      <Link href={`/${landing.slug}`} className="text-sm font-semibold text-ink underline-offset-4 hover:underline">
                        About {c.name} →
                      </Link>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tools.map((t) => (
                      <ToolCard key={t.id} tool={t} />
                    ))}
                  </div>
                </section>
              );
            })}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, label, count, dot }: { active: boolean; onClick: () => void; label: string; count: number; dot?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
        active ? "border-ink bg-ink text-white" : "border-slate-200 bg-white text-ink hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      {dot && <span className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} aria-hidden="true" />}
      {label}
      <span className={cn("text-xs tabular-nums", active ? "text-white/70" : "text-slate-500")}>{count}</span>
    </button>
  );
}
