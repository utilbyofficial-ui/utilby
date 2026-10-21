"use client";

import * as React from "react";
import Link from "next/link";
import { Wrench, Search, Menu, X, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TOOLS, CATEGORIES } from "@/lib/tools-registry";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredTools = searchQuery.trim()
    ? TOOLS.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Utility<span className="text-indigo-600 dark:text-indigo-400">Box</span>
              </span>
              <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                100% FREE
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500">Global Online Tools</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-slate-700 transition-colors hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
          >
            All Tools
          </Link>
          <div className="relative group">
            <button className="flex items-center gap-1 text-sm font-medium text-slate-700 transition-colors hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 py-2">
              Categories
            </button>
            <div className="absolute left-0 top-full hidden w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl group-hover:block dark:border-slate-800 dark:bg-slate-900">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/#${cat.id}`}
                  className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <div className="font-semibold">{cat.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{cat.description}</div>
                </Link>
              ))}
            </div>
          </div>
          <Link
            href="/about"
            className="text-sm font-medium text-slate-700 transition-colors hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-slate-700 transition-colors hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
          >
            Contact
          </Link>
        </nav>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search tools...</span>
            <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:bg-slate-800">
              /
            </kbd>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="sm:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-slate-600" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-4 md:hidden dark:border-slate-800 dark:bg-slate-900">
          <nav className="flex flex-col space-y-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-900 hover:text-indigo-600 dark:text-white"
            >
              All Tools Directory
            </Link>
            <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Categories
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/#${cat.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-md bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500 dark:border-slate-800">
              <Link href="/about" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
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
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools (e.g. word counter, json, percentage)..."
                className="w-full bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-3">
              {searchQuery.trim() === "" ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Type tool name or keywords to quickly jump to any utility.
                </div>
              ) : filteredTools.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
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
                      className="flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {tool.name}
                          </span>
                          {!tool.isReady && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                              Phase 2
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{tool.shortDescription}</p>
                      </div>
                      <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                        {tool.categoryName}
                      </span>
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
