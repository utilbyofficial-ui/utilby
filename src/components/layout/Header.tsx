"use client";

import * as React from "react";
import Link from "next/link";
import { Wrench, Search, Menu, X, ChevronRight, Sparkles } from "lucide-react";
import { TOOLS, CATEGORIES } from "@/lib/tools-registry";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Keyboard shortcut (⌘K or /) for instant search
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
          t.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Tagline */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 group-hover:bg-indigo-700 transition-colors">
            <Wrench className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                Util<span className="text-indigo-600">by</span>
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                Online Tools
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex md:items-center md:gap-7 text-sm font-medium text-slate-600">
          <Link href="/#popular-tools" className="hover:text-indigo-600 transition-colors">
            Popular Tools
          </Link>
          <Link href="/#categories" className="hover:text-indigo-600 transition-colors">
            Categories
          </Link>
          <Link href="/#all-tools" className="hover:text-indigo-600 transition-colors">
            All Tools
          </Link>
          <Link href="/about" className="hover:text-indigo-600 transition-colors">
            About
          </Link>
        </nav>

        {/* Search & Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-1.5 text-xs text-slate-500 hover:border-slate-300 hover:bg-white hover:text-slate-900 transition-all shadow-sm"
            aria-label="Search tools"
          >
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Search tools...</span>
            <kbd className="hidden sm:inline rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-200">
              ⌘K
            </kbd>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-5 py-4 md:hidden shadow-lg animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-3">
            <Link
              href="/#popular-tools"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-slate-900 hover:text-indigo-600 py-1"
            >
              Popular Tools
            </Link>
            <Link
              href="/#categories"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-slate-900 hover:text-indigo-600 py-1"
            >
              Categories Directory
            </Link>
            <Link
              href="/#all-tools"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-slate-900 hover:text-indigo-600 py-1"
            >
              All Utilities
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-slate-900 hover:text-indigo-600 py-1"
            >
              About Utilby
            </Link>

            <div className="border-t border-slate-100 pt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Quick Access
              </span>
              <div className="grid grid-cols-2 gap-2">
                {TOOLS.filter((t) => t.isReady).map((tool) => (
                  <Link
                    key={tool.id}
                    href={`/tools/${tool.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg bg-slate-50 p-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {tool.name}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-16 sm:pt-24 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center border-b border-slate-200 px-4 py-3 bg-slate-50/50">
              <Search className="h-4 w-4 text-slate-400 shrink-0 mr-3" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What do you want to do? (e.g. count words, format json)..."
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="rounded-md p-1 text-slate-400 hover:text-slate-700 ml-2"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {searchQuery.trim() === "" ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  <p className="font-medium text-slate-700 mb-1">Search any online tool</p>
                  <p>Type keywords to jump directly to any utility.</p>
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
                            <span className="rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 border border-emerald-100">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-0.5">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{tool.shortDescription}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
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
