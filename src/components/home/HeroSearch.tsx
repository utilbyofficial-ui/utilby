"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { searchTools } from "@/components/layout/Header";
import { ToolGlyph } from "@/components/shared/ToolGlyph";
import { cn } from "@/lib/utils";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const results = searchTools(query).slice(0, 6);

  React.useEffect(() => setActive(0), [query]);
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const go = (i: number) => {
    const t = results[i];
    if (t?.isReady) router.push(`/tools/${t.slug}`);
  };

  return (
    <div ref={wrapRef} className="relative mx-auto mt-9 w-full max-w-[640px] text-left">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(active);
        }}
        className="flex gap-2 rounded-[22px] bg-slate-100 p-2"
      >
        <label htmlFor="hero-search" className="sr-only">
          Search tools
        </label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            id="hero-search"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(results.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            role="combobox"
            aria-expanded={open && results.length > 0}
            aria-controls="hero-search-results"
            placeholder="Try “merge pdf” or “compress”"
            className="h-[52px] w-full rounded-2xl bg-white pl-12 pr-4 text-base text-ink shadow-soft placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
          />
        </div>
        <button type="submit" className="h-[52px] shrink-0 rounded-2xl bg-ink px-6 text-[15px] font-bold text-white transition-colors hover:bg-ink-soft">
          Find tool
        </button>
      </form>

      {open && query.trim() && (
        <div id="hero-search-results" className="animate-pop-in absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-3xl bg-white p-2 shadow-lift ring-1 ring-slate-200">
          {results.length === 0 ? (
            <p className="p-5 text-center text-sm text-slate-600">No tools match “{query}”.</p>
          ) : (
            <ul>
              {results.map((t, i) => (
                <li key={t.id}>
                  <Link
                    href={t.isReady ? `/tools/${t.slug}` : "#"}
                    onMouseEnter={() => setActive(i)}
                    className={cn("flex items-center gap-3 rounded-2xl p-2.5", i === active && "bg-slate-100", !t.isReady && "opacity-60")}
                  >
                    <ToolGlyph tool={t} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">
                        {t.name}
                        {!t.isReady && <span className="ml-2 text-xs font-medium text-slate-500">Coming soon</span>}
                      </span>
                      <span className="block truncate text-xs text-slate-600">{t.shortDescription}</span>
                    </span>
                    {i === active && t.isReady && <ArrowRight className="h-4 w-4 text-slate-500" />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
