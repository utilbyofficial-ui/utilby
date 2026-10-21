"use client";

import * as React from "react";
import Link from "next/link";
import { Wrench, Search, Menu, X, Sparkles, Cpu, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TOOLS, CATEGORIES } from "@/lib/tools-registry";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Quick keyboard shortcut (⌘K or /)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "/" && !searchOpen && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  const filteredTools = searchQuery.trim()
    ? TOOLS.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#07090E]/80 backdrop-blur-2xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30 group-hover:scale-105 transition-transform">
            <Wrench className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-[#07090E]" />
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                Util<span className="text-indigo-400">by</span>
              </span>
              <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[9px] font-mono font-bold text-indigo-300">
                100% IN-BROWSER
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Zero Cloud Overhead</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-7">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-300 transition-colors hover:text-white"
          >
            All Tools
          </Link>
          <a
            href="#engine-showcase"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 transition-colors hover:text-white"
          >
            <Cpu className="h-3.5 w-3.5 text-indigo-400" />
            <span>Architecture Engine</span>
          </a>
          <div className="relative group">
            <button className="flex items-center gap-1 text-xs font-semibold text-slate-300 transition-colors hover:text-white py-2">
              <span>Categories</span>
              <span className="text-[10px] text-slate-500 group-hover:text-slate-300">▾</span>
            </button>
            <div className="absolute left-0 top-full hidden w-64 rounded-xl border border-white/[0.08] bg-[#0C1019]/95 backdrop-blur-xl p-2 shadow-2xl group-hover:block">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/#${cat.id}`}
                  className="block rounded-lg px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  <div className="font-semibold text-white">{cat.name}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{cat.description}</div>
                </Link>
              ))}
            </div>
          </div>
          <Link
            href="/about"
            className="text-xs font-semibold text-slate-300 transition-colors hover:text-white"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-xs font-semibold text-slate-300 transition-colors hover:text-white"
          >
            Contact
          </Link>
        </nav>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 transition-all hover:border-indigo-500/40 hover:bg-white/[0.06] hover:text-slate-200"
          >
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span>Search utilities...</span>
            <kbd className="rounded border border-white/[0.1] bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-mono text-slate-400">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={() => setSearchOpen(true)}
            className="sm:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-white/[0.08] bg-[#07090E]/95 backdrop-blur-2xl px-5 py-5 md:hidden">
          <nav className="flex flex-col space-y-4">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-white hover:text-indigo-400"
            >
              All Tools Directory
            </Link>
            <a
              href="#engine-showcase"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-indigo-400 flex items-center gap-2"
            >
              <Cpu className="h-4 w-4" />
              <span>Architecture Engine</span>
            </a>
            <div className="border-t border-white/[0.08] pt-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                Categories
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/#${cat.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-xs font-medium text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="border-t border-white/[0.08] pt-3 flex items-center justify-between text-xs text-slate-400">
              <Link href="/about" onClick={() => setMobileMenuOpen(false)}>About</Link>
              <Link href="/privacy-policy" onClick={() => setMobileMenuOpen(false)}>Privacy</Link>
              <Link href="/terms-of-service" onClick={() => setMobileMenuOpen(false)}>Terms</Link>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            </div>
          </nav>
        </div>
      )}

      {/* Quick Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 pt-20 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-2xl border border-white/[0.1] bg-[#0C1019] shadow-2xl overflow-hidden">
            <div className="flex items-center border-b border-white/[0.08] px-4 py-3.5 bg-white/[0.02]">
              <Search className="h-4 w-4 text-indigo-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools (e.g. word counter, json, password)..."
                className="w-full bg-transparent px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none font-sans"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="rounded-md p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {searchQuery.trim() === "" ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  <p>Type keywords to search instantly across all tools.</p>
                  <p className="mt-1 font-mono text-[10px] text-slate-600">Press ESC to dismiss</p>
                </div>
              ) : filteredTools.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No tools found matching &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredTools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={tool.isReady ? `/tools/${tool.slug}` : "#"}
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06]"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {tool.name}
                          </span>
                          {tool.isReady ? (
                            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 text-[9px] font-mono text-emerald-400">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 text-[9px] font-mono text-amber-400">
                              Phase 2
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{tool.shortDescription}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
