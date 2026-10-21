"use client";

import * as React from "react";
import Link from "next/link";
import { Wrench, Search, Menu, X, Shield, Sparkles, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TOOLS, CATEGORIES } from "@/lib/tools-registry";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Wrench className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                Util<span className="text-indigo-600">by</span>
              </span>
              <span className="rounded-full bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                100% Free
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500">Fast Online Utilities</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-6 text-sm font-medium text-slate-600">
          <Link href="/" className="hover:text-indigo-600 transition-colors">
            All Tools
          </Link>
          <Link href="/tools/word-counter" className="hover:text-indigo-600 transition-colors">
            Word Counter
          </Link>
          <Link href="/tools/json-formatter" className="hover:text-indigo-600 transition-colors">
            JSON Formatter
          </Link>
          <Link href="/tools/percentage-calculator" className="hover:text-indigo-600 transition-colors">
            Percentage
          </Link>
          <Link href="/tools/password-generator" className="hover:text-indigo-600 transition-colors">
            Password Gen
          </Link>
          <Link href="/about" className="hover:text-indigo-600 transition-colors">
            About
          </Link>
        </nav>

        {/* Search & Mobile Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-500 hover:border-indigo-300 hover:bg-white hover:text-slate-800 transition-all shadow-sm"
          >
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Search tools...</span>
            <kbd className="hidden sm:inline rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-200">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-5 py-4 md:hidden shadow-lg">
          <nav className="flex flex-col space-y-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-slate-900 hover:text-indigo-600"
            >
              All Tools Directory
            </Link>
            <div className="border-t border-slate-100 pt-2 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Popular Tools
              </span>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/tools/word-counter"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-slate-50 p-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  Word Counter
                </Link>
                <Link
                  href="/tools/json-formatter"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-slate-50 p-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  JSON Formatter
                </Link>
                <Link
                  href="/tools/percentage-calculator"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-slate-50 p-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  Percentage Calc
                </Link>
                <Link
                  href="/tools/password-generator"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-slate-50 p-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  Password Gen
                </Link>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
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
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-20 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center border-b border-slate-200 px-4 py-3 bg-slate-50/50">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools (e.g. word counter, json, password)..."
                className="w-full bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="rounded-md p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {searchQuery.trim() === "" ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Type tool name or keywords to jump directly to any utility.
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
                      className="flex items-center justify-between rounded-xl p-3 hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {tool.name}
                          </span>
                          {tool.isReady ? (
                            <span className="rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5">
                              Phase 2
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{tool.shortDescription}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
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
