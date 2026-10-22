"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { TOOLS, CATEGORIES, ToolMeta } from "@/lib/tools-registry";
import { AdSlot } from "@/components/ads/AdSlot";
import {
  FileText,
  Code2,
  Percent,
  Type,
  ShieldCheck,
  Maximize2,
  Minimize2,
  QrCode,
  Combine,
  FileArchive,
  ArrowRight,
  Shield,
  Zap,
  Lock,
  Search,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const activeTools = useMemo(() => TOOLS.filter((t) => t.isReady), []);
  const upcomingTools = useMemo(() => TOOLS.filter((t) => !t.isReady), []);

  // Filter tools based on hero search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return TOOLS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.shortDescription.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case "FileText":
        return <FileText className="h-5 w-5 text-indigo-600" />;
      case "Code2":
        return <Code2 className="h-5 w-5 text-emerald-600" />;
      case "Percent":
        return <Percent className="h-5 w-5 text-amber-600" />;
      case "Type":
        return <Type className="h-5 w-5 text-violet-600" />;
      case "ShieldCheck":
        return <ShieldCheck className="h-5 w-5 text-teal-600" />;
      case "Maximize2":
        return <Maximize2 className="h-5 w-5 text-sky-600" />;
      case "Minimize2":
        return <Minimize2 className="h-5 w-5 text-rose-600" />;
      case "QrCode":
        return <QrCode className="h-5 w-5 text-cyan-600" />;
      case "Combine":
        return <Combine className="h-5 w-5 text-orange-600" />;
      case "FileArchive":
        return <FileArchive className="h-5 w-5 text-red-600" />;
      default:
        return <Zap className="h-5 w-5 text-indigo-600" />;
    }
  };

  const popularPills = [
    { label: "Word Counter", slug: "word-counter" },
    { label: "JSON Formatter", slug: "json-formatter" },
    { label: "Percentage Calculator", slug: "percentage-calculator" },
    { label: "Password Generator", slug: "password-generator" },
    { label: "Text Case Converter", slug: "text-case-converter" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFB] text-slate-900">
      {/* Hero Section */}
      <section className="relative border-b border-slate-200/80 bg-white pt-16 pb-16 sm:pt-24 sm:pb-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-semibold text-slate-700 mb-6 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>100% Free Online Utility Tools</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            Simple Tools.{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Smarter Work.
            </span>
          </h1>

          {/* Supporting Subtitle */}
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed">
            Free online tools to format, calculate, convert, and create — quickly, securely, and without unnecessary complexity.
          </p>

          {/* Prominent Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto relative">
            <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
              <Search className="h-5 w-5 text-slate-400 ml-3 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What do you want to do? (e.g., count words, format JSON, generate password)..."
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none py-1.5"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mr-2 text-xs text-slate-400 hover:text-slate-700 px-2 py-1 font-medium"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Instant Search Results Dropdown */}
            {searchQuery.trim() !== "" && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-30 max-h-80 overflow-y-auto text-left">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No tools match &quot;{searchQuery}&quot;. Try &quot;word&quot;, &quot;json&quot;, or &quot;password&quot;.
                  </div>
                ) : (
                  searchResults.map((tool) => (
                    <Link
                      key={tool.id}
                      href={tool.isReady ? `/tools/${tool.slug}` : "#"}
                      className="flex items-center justify-between rounded-xl p-3 hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {tool.name}
                          </span>
                          {tool.isReady ? (
                            <span className="rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 border border-emerald-100">
                              Available
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-0.5">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{tool.shortDescription}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Suggestions / Popular Search Pills */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-500 font-medium mr-1">Popular:</span>
            {popularPills.map((pill) => (
              <Link
                key={pill.slug}
                href={`/tools/${pill.slug}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-2xs"
              >
                {pill.label}
              </Link>
            ))}
          </div>

          {/* Verified Trust Indicators */}
          <div className="mt-10 pt-8 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>100% Free Forever</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600" />
              <span>Browser-Based Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-600" />
              <span>No Sign-up Required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-20">
        {/* Popular Tools Section */}
        <section id="popular-tools" className="scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3 border-b border-slate-200 pb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Core Utilities
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Popular Tools
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              High-performance, tested, and actively maintained utility tools ready for immediate use.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activeTools.map((tool) => (
              <Link
                key={tool.id}
                href={`/tools/${tool.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                      {getToolIcon(tool.iconName)}
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                      {tool.categoryName}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {tool.shortDescription}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                  <span>Open Tool</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* AdSense Safe Placement Slot */}
        <AdSlot slotId="homepage-mid-banner" format="horizontal-banner" />

        {/* Browse Categories Section */}
        <section id="categories" className="scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3 border-b border-slate-200 pb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Directory
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Browse Categories
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              Explore tools organized by domain. Active categories provide live tools, while roadmap categories are in active engineering.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const activeInCat = activeTools.filter((t) => t.category === cat.id);
              const upcomingInCat = upcomingTools.filter((t) => t.category === cat.id);
              const totalCount = activeInCat.length + upcomingInCat.length;
              const hasActiveTools = activeInCat.length > 0;

              return (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-bold text-slate-900">{cat.name}</h3>
                      {hasActiveTools ? (
                        <span className="rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 border border-emerald-100">
                          {activeInCat.length} Available
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-0.5">
                          In Development
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      {cat.description}
                    </p>

                    <div className="border-t border-slate-100 pt-3 space-y-1.5">
                      {activeInCat.map((t) => (
                        <Link
                          key={t.id}
                          href={`/tools/${t.slug}`}
                          className="flex items-center justify-between text-xs text-slate-700 hover:text-indigo-600 py-1 font-medium transition-colors"
                        >
                          <span>{t.name}</span>
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
                            Active
                          </span>
                        </Link>
                      ))}

                      {upcomingInCat.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between text-xs text-slate-400 py-1 select-none"
                        >
                          <span>{t.name}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                            Coming Soon
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Upcoming Tools Section (Roadmap) */}
        <section id="upcoming-tools" className="rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-xs">
          <div className="max-w-2xl mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Product Roadmap
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Upcoming Tools
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              We are expanding Utilby with in-browser image optimization, QR code synthesis, and PDF manipulation with verified client-side privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {upcomingTools.map((tool) => (
              <div
                key={tool.id}
                className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200">
                    {getToolIcon(tool.iconName)}
                  </div>
                  <div className="text-xs font-bold text-slate-900">{tool.name}</div>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {tool.shortDescription}
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-200/60">
                  <span className="rounded-full bg-slate-200/70 text-slate-600 text-[10px] font-semibold px-2 py-0.5">
                    Coming Soon
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trust & Value Proposition */}
        <section className="border-t border-slate-200/80 pt-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Our Commitment
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Why Professionals Use Utilby
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Engineered from the ground up for speed, confidentiality, and reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold mb-4">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Browser-Based Privacy</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Your text, inputs, and generated passwords are processed directly in your device’s browser memory. Zero user content is sent to our servers.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold mb-4">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Zero Execution Lag</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Calculations execute in real-time as you type. No waiting in remote server queues or waiting for slow network uploads.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 font-bold mb-4">
                <CheckCircle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Permanently Free Access</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Utilby is completely free to use. There are no paywalls, hidden tier limits, or mandatory accounts required to access any tool.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
