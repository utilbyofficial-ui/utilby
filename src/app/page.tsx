"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { TOOLS, CATEGORIES } from "@/lib/tools-registry";
import { AdSlot } from "@/components/ads/AdSlot";
import { DedicatedToolsShowcase } from "@/components/home/DedicatedToolsShowcase";
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
  Sparkles,
  Lock,
  Globe2,
  Search,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const readyTools = TOOLS.filter((t) => t.isReady);
  const roadmapTools = TOOLS.filter((t) => !t.isReady);

  const getToolIcon = (name: string) => {
    switch (name) {
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

  const filteredReadyTools = useMemo(() => {
    return readyTools.filter((tool) => {
      const matchesSearch =
        searchFilter.trim() === "" ||
        tool.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        tool.shortDescription.toLowerCase().includes(searchFilter.toLowerCase()) ||
        tool.keywords.some((k) => k.toLowerCase().includes(searchFilter.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" || tool.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [readyTools, searchFilter, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-16 sm:pt-20 sm:pb-20 border-b border-slate-200/80 bg-white">
        <div className="absolute inset-0 light-dot-grid opacity-60 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-1.5 text-xs font-semibold text-indigo-700 mb-6 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% Client-Side • Zero Cloud Uploads • Free Forever</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            Smart Online Tools to{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 bg-clip-text text-transparent">
              Simplify Your Daily Work
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-slate-600 leading-relaxed">
            Free, fast, and privacy-first online utilities. Process text, format JSON, compute percentages, and generate cryptographic passwords directly in your browser RAM with zero server delay.
          </p>

          {/* Value Pillars */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-600" />
              <span>100% In-Browser Privacy</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Sub-Millisecond Execution</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600" />
              <span>No Software Install Required</span>
            </div>
          </div>
        </div>
      </section>

      {/* DEDICATED TOOLS LIVE WORKSPACE SHOWCASE (Clicks switch to each tool's dedicated section) */}
      <DedicatedToolsShowcase />

      {/* Main Tools Directory Section */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3 border-b border-slate-200 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Complete Directory
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              All Available Online Utilities
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md">
            Pick any tool to launch its dedicated full page with comprehensive guides and zero signups.
          </p>
        </div>

        {/* Filter / Search Bar */}
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter tools..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedCategory === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              All ({readyTools.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = readyTools.filter((t) => t.category === cat.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Tools Cards Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReadyTools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.slug}`}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                    {getToolIcon(tool.iconName)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 border border-emerald-100">
                      Active
                    </span>
                    <span className="rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5">
                      {tool.categoryName}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {tool.name}
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  {tool.shortDescription}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                <span>Open Dedicated Tool</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>

        {/* AdSense Safe Banner Slot */}
        <div className="my-14">
          <AdSlot slotId="homepage-directory-banner" format="horizontal-banner" />
        </div>

        {/* Category Breakdown Section */}
        <div className="mb-14">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Browse by Domain
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Category Directory
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const toolsInCat = TOOLS.filter((t) => t.category === cat.id);
              return (
                <div
                  key={cat.id}
                  id={cat.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                    <span className="text-xs text-slate-500">{toolsInCat.length} Tools</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">{cat.description}</p>

                  <ul className="space-y-1.5 border-t border-slate-100 pt-3">
                    {toolsInCat.map((t) => (
                      <li key={t.id}>
                        {t.isReady ? (
                          <Link
                            href={`/tools/${t.slug}`}
                            className="flex items-center justify-between text-xs text-slate-700 hover:text-indigo-600 py-1 font-medium transition-colors"
                          >
                            <span>{t.name}</span>
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
                              Live
                            </span>
                          </Link>
                        ) : (
                          <div className="flex items-center justify-between text-xs text-slate-400 py-1">
                            <span>{t.name}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                              Phase 2
                            </span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Tools (Phase 2 & 3 Roadmap) */}
        <div className="rounded-3xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white p-8 sm:p-10 shadow-sm">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Active Roadmap
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Upcoming Image &amp; PDF Tools
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              We are actively building client-side Canvas and Web Worker engines for image resizing, compression, and QR code generation with zero server uploads.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {roadmapTools.map((tool) => (
              <div
                key={tool.id}
                className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
              >
                <div className="mb-2">{getToolIcon(tool.iconName)}</div>
                <div className="text-xs font-bold text-slate-800">{tool.name}</div>
                <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {tool.shortDescription}
                </div>
                <div className="mt-3">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    In Development
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
