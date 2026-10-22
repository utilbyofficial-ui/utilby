"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Search, Menu, X, ArrowRight } from "lucide-react";
import { TOOLS, CATEGORIES } from "@/lib/tools-registry";
import { Logo, ToolGlyph } from "@/components/shared/ToolGlyph";
import { cn } from "@/lib/utils";
import { POPULAR_TOOL_IDS } from "@/lib/category-style";

const NAV = [
  { label: "All tools", href: "/#all-tools" },
  { label: "PDF", href: "/#pdf" },
  { label: "Images", href: "/#image" },
  { label: "Text", href: "/#text" },
  { label: "Developer", href: "/#developer" },
];

export function searchTools(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.shortDescription.toLowerCase().includes(q) ||
      t.keywords.some((k) => k.toLowerCase().includes(q))
  ).sort((a, b) => Number(b.isReady) - Number(a.isReady));
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // ⌘K / Ctrl+K or "/" opens search; Esc closes.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      } else if (e.key === "/" && !searchOpen && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  React.useEffect(() => {
    document.body.style.overflow = searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [searchOpen]);

  const popular = POPULAR_TOOL_IDS.map((id) => TOOLS.find((t) => t.id === id)!).filter(Boolean);
  const results = query.trim() ? searchTools(query) : popular;
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => setActive(0), [query]);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md transition-shadow",
        scrolled ? "shadow-[0_1px_0_0_#ECEAF3]" : ""
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Utilby home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 text-[15px] font-semibold text-slate-700 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-3.5 py-2 transition-colors hover:bg-slate-100 hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-10 items-center gap-2.5 rounded-full bg-slate-100 pl-3.5 pr-2 text-sm text-slate-600 transition-colors hover:bg-slate-200 hover:text-ink"
            aria-label="Search tools"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search tools</span>
            <kbd className="hidden rounded-full bg-white px-2 py-0.5 font-sans text-[11px] font-semibold text-slate-500 sm:inline">⌘K</kbd>
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-ink md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="animate-fade-up border-t border-slate-200 bg-white px-4 pb-6 pt-3 shadow-lift md:hidden">
          <nav aria-label="Mobile" className="flex flex-wrap gap-2">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-full bg-slate-100 px-4 py-2.5 text-sm font-semibold text-ink">
                {n.label}
              </Link>
            ))}
          </nav>
          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">Popular</p>
          <div className="grid grid-cols-1 gap-1">
            {popular.map((t) => (
              <Link key={t.id} href={`/tools/${t.slug}`} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-slate-50">
                <ToolGlyph tool={t} size="sm" />
                <span className="text-sm font-semibold text-ink">{t.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search dialog (portaled to <body> so the header's backdrop-blur doesn't trap it) */}
      {searchOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 p-4 pt-[12vh] backdrop-blur-sm"
          onClick={closeSearch}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search tools"
            className="animate-pop-in w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
              <Search className="h-5 w-5 shrink-0 text-slate-500" />
              <label htmlFor="global-search" className="sr-only">
                Search tools
              </label>
              <input
                id="global-search"
                type="search"
                autoFocus
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(results.length - 1, a + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(0, a - 1));
                  } else if (e.key === "Enter" && results[active]?.isReady) {
                    window.location.href = `/tools/${results[active].slug}`;
                  }
                }}
                placeholder="What do you want to do? e.g. merge pdf"
                className="w-full bg-transparent text-base text-ink placeholder:text-slate-400 focus:outline-none"
              />
              <button type="button" onClick={closeSearch} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-ink" aria-label="Close search">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {!query.trim() && <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Popular tools</p>}
              {results.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-600">No tools match “{query}”. Try “pdf”, “image” or “json”.</p>
              ) : (
                <ul>
                  {results.map((t, i) => (
                    <li key={t.id}>
                      <Link
                        href={t.isReady ? `/tools/${t.slug}` : "#"}
                        aria-disabled={!t.isReady}
                        onClick={closeSearch}
                        onMouseEnter={() => setActive(i)}
                        className={cn(
                          "flex items-center gap-3.5 rounded-2xl p-2.5 transition-colors",
                          i === active ? "bg-slate-100" : "",
                          !t.isReady && "opacity-60"
                        )}
                      >
                        <ToolGlyph tool={t} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                            {t.name}
                            {!t.isReady && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Soon</span>}
                          </span>
                          <span className="block truncate text-xs text-slate-600">{t.shortDescription}</span>
                        </span>
                        {i === active && t.isReady && <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-[11px] text-slate-500">
              <span>{CATEGORIES.length} categories · {TOOLS.filter((t) => t.isReady).length} tools</span>
              <span>↑↓ to move · Enter to open · Esc to close</span>
            </div>
          </div>
        </div>
      , document.body)}
    </header>
  );
}
