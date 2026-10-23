"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Search, Menu, X, ArrowRight, ChevronDown } from "lucide-react";
import { TOOLS, CATEGORIES, type ToolMeta } from "@/lib/tools-registry";
import { Logo, ToolGlyph, CategoryGlyph } from "@/components/shared/ToolGlyph";
import { cn } from "@/lib/utils";
import { POPULAR_TOOL_IDS, CATEGORY_ORDER } from "@/lib/category-style";
import { CATEGORY_LANDING_PAGES } from "@/lib/category-landing";

type CategoryId = ToolMeta["category"];

/** Main navigation: one dropdown per toolbox (order follows CATEGORY_ORDER). */
const NAV_CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "pdf", label: "PDF" },
  { id: "image", label: "Images" },
  { id: "text", label: "Text" },
  { id: "developer", label: "Developer" },
  { id: "calculators", label: "Calculators" },
  { id: "security", label: "Security" },
];

const categoryHref = (id: CategoryId) => `/${CATEGORY_LANDING_PAGES[id]?.slug ?? `tools#${id}`}`;
const toolsIn = (id: CategoryId) => TOOLS.filter((t) => t.category === id).sort((a, b) => Number(b.isReady) - Number(a.isReady));

function NavDropdown({ id, label, open, onOpen, onClose }: { id: CategoryId; label: string; open: boolean; onOpen: () => void; onClose: () => void }) {
  const tools = toolsIn(id);
  const wide = tools.length > 5;
  const category = CATEGORIES.find((c) => c.id === id);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // After Escape we move focus back to the trigger; don't let that focus re-open the menu.
  const suppressFocusOpen = React.useRef(false);
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(onClose, 140);
  };
  React.useEffect(() => cancelClose, []);

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        onOpen();
      }}
      onMouseLeave={scheduleClose}
      onFocus={() => {
        cancelClose();
        if (suppressFocusOpen.current) return;
        onOpen();
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          suppressFocusOpen.current = false;
          scheduleClose();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          suppressFocusOpen.current = true;
          onClose();
          (e.currentTarget.querySelector("a") as HTMLElement | null)?.focus();
        } else if (e.key === "ArrowDown" && !open) {
          e.preventDefault();
          suppressFocusOpen.current = false;
          onOpen();
        }
      }}
    >
      <Link
        href={categoryHref(id)}
        aria-haspopup="true"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-1 rounded-full px-3 py-2 transition-colors hover:bg-slate-100 hover:text-ink",
          open && "bg-slate-100 text-ink"
        )}
      >
        {label}
        <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform", open && "rotate-180 text-ink")} aria-hidden="true" />
      </Link>
      {open && (
        <div className={cn("absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2", wide ? "w-[600px]" : "w-[340px]")}>
          <div className="animate-pop-in overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lift">
            <ul className={cn("grid gap-1 p-2", wide ? "grid-cols-2" : "grid-cols-1")}>
              {tools.map((t) => (
                <li key={t.id}>
                  {t.isReady ? (
                    <Link href={`/tools/${t.slug}`} onClick={onClose} className="flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50">
                      <ToolGlyph tool={t} size="sm" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">{t.name}</span>
                        <span className="block truncate text-xs font-normal text-slate-600">{t.shortDescription}</span>
                      </span>
                    </Link>
                  ) : (
                    <span className="flex items-center gap-3 rounded-2xl p-2.5 opacity-60">
                      <ToolGlyph tool={t} size="sm" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">
                          {t.name} <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">Soon</span>
                        </span>
                        <span className="block truncate text-xs font-normal text-slate-600">{t.shortDescription}</span>
                      </span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <Link href={categoryHref(id)} onClick={onClose} className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 text-sm font-semibold text-ink hover:bg-slate-100">
              All {category?.name ?? label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [heroScrolledPast, setHeroScrolledPast] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState<CategoryId | null>(null);
  const isHomepage = pathname === "/";

  React.useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
      setHeroScrolledPast(window.scrollY > 260);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setOpenMenu(null);
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
        "sticky top-0 z-40 w-full transition-all duration-300 ease-out",
        scrolled ? "pt-2 sm:pt-3 px-3 sm:px-6" : "pt-0 px-0"
      )}
    >
      <div
        className={cn(
          "mx-auto flex items-center justify-between gap-4 transition-all duration-300 ease-out",
          scrolled
            ? "h-14 max-w-[1220px] rounded-2xl bg-white/85 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl border border-slate-200/80 sm:px-6"
            : "h-16 max-w-[1240px] bg-white/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 border-b border-slate-100"
        )}
      >
        <Link href="/" aria-label="Utilby home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 text-[15px] font-semibold text-slate-700 lg:flex">
          <Link href="/tools" className={cn("rounded-full px-3 py-2 transition-colors hover:bg-slate-100 hover:text-ink", pathname === "/tools" && "bg-slate-100 text-ink")}>
            All tools
          </Link>
          {NAV_CATEGORIES.map((n) => (
            <NavDropdown key={n.id} id={n.id} label={n.label} open={openMenu === n.id} onOpen={() => setOpenMenu(n.id)} onClose={() => setOpenMenu((m) => (m === n.id ? null : m))} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={cn(
              "flex h-10 items-center gap-2.5 rounded-full bg-slate-100 pl-3.5 pr-2 text-sm text-slate-600 transition-all duration-200 hover:bg-slate-200 hover:text-ink",
              (!isHomepage || heroScrolledPast)
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 -translate-y-1 pointer-events-none invisible"
            )}
            aria-label="Search tools"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search tools</span>
            <kbd className="hidden rounded-full bg-white px-2 py-0.5 font-sans text-[11px] font-semibold text-slate-500 sm:inline">⌘K</kbd>
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-ink lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className={cn(
            "animate-fade-up bg-white px-4 pb-6 pt-3 shadow-lift md:hidden transition-all",
            scrolled
              ? "mx-auto mt-2 max-w-[1220px] rounded-2xl border border-slate-200/80"
              : "border-t border-slate-200"
          )}
        >
          <nav aria-label="Mobile" className="max-h-[75vh] overflow-y-auto">
            <Link href="/tools" className="flex items-center justify-between rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white">
              All {TOOLS.filter((t) => t.isReady).length} tools
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <div className="mt-3 divide-y divide-slate-100">
              {CATEGORY_ORDER.map((id) => {
                const c = CATEGORIES.find((x) => x.id === id);
                const tools = toolsIn(id).filter((t) => t.isReady);
                if (!c || !tools.length) return null;
                return (
                  <details key={id} className="group py-1">
                    <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl px-1 py-2.5 [&::-webkit-details-marker]:hidden">
                      <CategoryGlyph category={id} size="sm" />
                      <span className="flex-1 text-sm font-bold text-ink">{c.name}</span>
                      <span className="text-xs text-slate-500">{tools.length}</span>
                      <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <ul className="grid grid-cols-1 gap-0.5 pb-2 pl-12 sm:grid-cols-2">
                      {tools.map((t) => (
                        <li key={t.id}>
                          <Link href={`/tools/${t.slug}`} className="block rounded-xl px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-ink">
                            {t.name}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link href={categoryHref(id)} className="block rounded-xl px-2 py-2 text-sm font-semibold text-ink hover:bg-slate-50">
                          All {c.name} →
                        </Link>
                      </li>
                    </ul>
                  </details>
                );
              })}
            </div>
          </nav>
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
