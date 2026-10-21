"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { TOOLS, CATEGORIES } from "@/lib/tools-registry";
import { AdSlot } from "@/components/ads/AdSlot";
import { InteractiveArchitectureShowcase } from "@/components/home/InteractiveArchitectureShowcase";
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
  Cpu,
  Layers,
} from "lucide-react";

export default function HomePage() {
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const readyTools = TOOLS.filter((t) => t.isReady);
  const roadmapTools = TOOLS.filter((t) => !t.isReady);

  const getToolIcon = (name: string) => {
    switch (name) {
      case "FileText":
        return <FileText className="h-5 w-5 text-indigo-400" />;
      case "Code2":
        return <Code2 className="h-5 w-5 text-emerald-400" />;
      case "Percent":
        return <Percent className="h-5 w-5 text-amber-400" />;
      case "Type":
        return <Type className="h-5 w-5 text-violet-400" />;
      case "ShieldCheck":
        return <ShieldCheck className="h-5 w-5 text-teal-400" />;
      case "Maximize2":
        return <Maximize2 className="h-5 w-5 text-sky-400" />;
      case "Minimize2":
        return <Minimize2 className="h-5 w-5 text-rose-400" />;
      case "QrCode":
        return <QrCode className="h-5 w-5 text-cyan-400" />;
      case "Combine":
        return <Combine className="h-5 w-5 text-orange-400" />;
      case "FileArchive":
        return <FileArchive className="h-5 w-5 text-red-400" />;
      default:
        return <Zap className="h-5 w-5 text-indigo-400" />;
    }
  };

  // Filter tools based on search and category
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
    <div className="min-h-screen bg-[#07090E] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-24 border-b border-white/[0.08]">
        {/* Subtle Ambient Glow Meshes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-indigo-600/15 via-violet-600/10 to-transparent blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 tech-dot-grid opacity-20 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-mono font-medium text-indigo-300 backdrop-blur-md mb-8 shadow-inner shadow-indigo-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>100% Client-Side • Zero Cloud Uploads • Sub-Millisecond</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
            Next-Generation Online Tools.{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-300 bg-clip-text text-transparent">
              Zero Latency. Private by Design.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed font-sans">
            Free, fast, and privacy-respecting browser utilities. Word counter, JSON AST formatter, financial calculator, and cryptographic password generator executing 100% locally in your browser RAM.
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3.5 py-1.5">
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
              <span>0 Bytes Sent to Cloud</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3.5 py-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Latency: &lt; 0.2ms</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3.5 py-1.5">
              <Shield className="h-3.5 w-3.5 text-indigo-400" />
              <span>100% Free Forever</span>
            </div>
          </div>

          {/* Interactive Fast Filter / Search Bar */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="relative rounded-2xl border border-white/[0.12] bg-[#0C1019]/90 p-2 shadow-2xl backdrop-blur-xl focus-within:border-indigo-500/60 focus-within:shadow-[0_0_30px_rgba(99,102,241,0.25)] transition-all">
              <div className="flex items-center px-3">
                <Search className="h-5 w-5 text-indigo-400 shrink-0" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter utilities instantly (e.g. word, json, password, percent)..."
                  className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none font-sans"
                />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter("")}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 font-mono"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`rounded-lg px-2.5 py-1 font-mono text-[11px] transition-all whitespace-nowrap ${
                    selectedCategory === "all"
                      ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  }`}
                >
                  All Tools ({readyTools.length})
                </button>
                {CATEGORIES.map((cat) => {
                  const count = readyTools.filter((t) => t.category === cat.id).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`rounded-lg px-2.5 py-1 font-mono text-[11px] transition-all whitespace-nowrap ${
                        selectedCategory === cat.id
                          ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                      }`}
                    >
                      {cat.name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Railway-Inspired Architecture Engine Showcase */}
      <div id="engine-showcase">
        <InteractiveArchitectureShowcase />
      </div>

      {/* Featured Tools Grid */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-3 border-b border-white/[0.06] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                Production Ready // Phase 1 MVP
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Instant Online Utilities
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            Click any tool to run client-side computations with zero login screens and 100% confidentiality.
          </p>
        </div>

        {/* The Tool Cards */}
        {filteredReadyTools.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0C1019] p-12 text-center">
            <p className="text-sm text-slate-400">No tools match your search &quot;{searchFilter}&quot;.</p>
            <button
              onClick={() => {
                setSearchFilter("");
                setSelectedCategory("all");
              }}
              className="mt-3 text-xs font-mono text-indigo-400 hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredReadyTools.map((tool) => (
              <Link
                key={tool.id}
                href={`/tools/${tool.slug}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0C1019]/80 p-6 backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/50 hover:bg-[#101522] hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.25)] hover:-translate-y-1"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.08] group-hover:bg-indigo-600/20 group-hover:border-indigo-500/40 transition-colors">
                      {getToolIcon(tool.iconName)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                        ⚡ &lt; 0.1ms
                      </span>
                      <span className="rounded-full bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 text-[10px] font-mono text-slate-400">
                        {tool.categoryName}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    {tool.shortDescription}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                  <span className="font-mono text-[11px]">Execute In-Browser</span>
                  <div className="flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                    <span>Open</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* AdSense Placement Slot (Policy Compliant, Zero CLS) */}
        <div className="my-14">
          <AdSlot slotId="homepage-directory-banner" format="horizontal-banner" />
        </div>

        {/* Category-based Navigation */}
        <div className="mb-16">
          <div className="mb-8">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">
              Ecosystem Index
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Browse Tools by Domain
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const toolsInCat = TOOLS.filter((t) => t.category === cat.id);
              return (
                <div
                  key={cat.id}
                  id={cat.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#0C1019]/60 p-6 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-white">{cat.name}</h3>
                    <span className="rounded-full bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 text-[10px] font-mono text-slate-400">
                      {toolsInCat.length} Tools
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">{cat.description}</p>

                  <ul className="space-y-2 border-t border-white/[0.06] pt-3">
                    {toolsInCat.map((t) => (
                      <li key={t.id}>
                        {t.isReady ? (
                          <Link
                            href={`/tools/${t.slug}`}
                            className="flex items-center justify-between text-xs text-slate-300 hover:text-white py-1 group/item transition-colors"
                          >
                            <span className="font-medium group-hover/item:text-indigo-300 transition-colors">
                              {t.name}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          </Link>
                        ) : (
                          <div className="flex items-center justify-between text-xs text-slate-500 py-1 select-none">
                            <span>{t.name}</span>
                            <span className="text-[10px] font-mono text-slate-500 bg-white/[0.02] border border-white/[0.06] px-2 py-0.5 rounded-full">
                              Phase 2/3
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

        {/* Phase 2 & 3 Roadmap Section */}
        <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-indigo-950/20 via-[#0C1019] to-[#07090E] p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-2xl relative z-10">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">
              Pipeline Expansion // In Active Engineering
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-1">
              Upcoming Image &amp; Media Tools
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
              We are expanding the Utilby engine with client-side WebAssembly and HTML5 Canvas Offscreen Workers for 100% private image compression, resizing, QR code synthesis, and PDF merging.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
            {roadmapTools.map((tool) => (
              <div
                key={tool.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-md"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  {getToolIcon(tool.iconName)}
                </div>
                <div className="text-xs font-bold text-white">{tool.name}</div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {tool.shortDescription}
                </div>
                <div className="mt-4">
                  <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[9px] font-mono font-semibold text-indigo-300">
                    In Pipeline
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
