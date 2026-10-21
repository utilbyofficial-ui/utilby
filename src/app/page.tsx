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
} from "lucide-react";

export default function HomePage() {
  const readyTools = TOOLS.filter((t) => t.isReady);
  const roadmapTools = TOOLS.filter((t) => !t.isReady);

  const getToolIcon = (name: string) => {
    switch (name) {
      case "FileText":
        return <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />;
      case "Code2":
        return <Code2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />;
      case "Percent":
        return <Percent className="h-6 w-6 text-amber-600 dark:text-amber-400" />;
      case "Type":
        return <Type className="h-6 w-6 text-violet-600 dark:text-violet-400" />;
      case "ShieldCheck":
        return <ShieldCheck className="h-6 w-6 text-teal-600 dark:text-teal-400" />;
      case "Maximize2":
        return <Maximize2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
      case "Minimize2":
        return <Minimize2 className="h-6 w-6 text-rose-600 dark:text-rose-400" />;
      case "QrCode":
        return <QrCode className="h-6 w-6 text-sky-600 dark:text-sky-400" />;
      case "Combine":
        return <Combine className="h-6 w-6 text-orange-600 dark:text-orange-400" />;
      case "FileArchive":
        return <FileArchive className="h-6 w-6 text-red-600 dark:text-red-400" />;
      default:
        return <Zap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-white py-16 sm:py-24 dark:border-slate-800 dark:bg-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.08]" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3.5 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Fast, Secure & 100% Free Browser Utilities</span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl dark:text-white max-w-4xl mx-auto leading-tight">
            Smart Online Tools to{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Simplify Your Daily Work
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 sm:text-lg dark:text-slate-400 leading-relaxed">
            Free, fast, and privacy-respecting online utilities. Process text, format JSON, compute percentages, generate cryptographic passwords, and optimize files directly in your browser with zero server uploads.
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-medium text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-500" />
              <span>100% Client-Side Privacy</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Sub-second Instant Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-indigo-500" />
              <span>No Software Install Required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Railway-Style Architecture Engine Showcase */}
      <InteractiveArchitectureShowcase />

      {/* Main Tools Directory */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Ready Foundation Tools (Phase 1 MVP) */}
        <div className="mb-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Phase 1 MVP
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Featured Online Utilities
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              Fully active, thoroughly tested, and ready for immediate production use.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {readyTools.map((tool) => (
              <Link
                key={tool.id}
                href={`/tools/${tool.slug}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-indigo-50 dark:bg-slate-800 dark:border-slate-700 dark:group-hover:bg-indigo-950/60 transition-colors">
                      {getToolIcon(tool.iconName)}
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {tool.categoryName}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white transition-colors">
                    {tool.name}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed dark:text-slate-400">
                    {tool.shortDescription}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                  <span>Open Tool</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Non-intrusive Directory Ad Slot */}
        <AdSlot slotId="homepage-directory-banner" format="horizontal-banner" />

        {/* Category-based Navigation */}
        <div className="mb-14">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Directory
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Browse by Category
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const toolsInCat = TOOLS.filter((t) => t.category === cat.id);
              return (
                <div
                  key={cat.id}
                  id={cat.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{cat.name}</span>
                    <span className="text-xs font-normal text-slate-400">
                      {toolsInCat.length} Tools
                    </span>
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 mb-4">{cat.description}</p>
                  <ul className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    {toolsInCat.map((t) => (
                      <li key={t.id}>
                        {t.isReady ? (
                          <Link
                            href={`/tools/${t.slug}`}
                            className="flex items-center justify-between text-xs text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 py-1"
                          >
                            <span className="font-medium">{t.name}</span>
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                              Live
                            </span>
                          </Link>
                        ) : (
                          <div className="flex items-center justify-between text-xs text-slate-400 py-1 select-none">
                            <span>{t.name}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
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

        {/* Roadmap Preview Section */}
        <div className="mb-14 rounded-3xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white p-8 sm:p-12 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Ecosystem Expansion
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              Upcoming Image & PDF Tools
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              We are actively developing Phase 2 and Phase 3 tools utilizing browser Web Workers and Canvas APIs for zero-server image compression, resizing, QR generation, and PDF manipulation.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {roadmapTools.map((tool) => (
              <div
                key={tool.id}
                className="rounded-xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60 backdrop-blur-sm"
              >
                <div className="mb-2">{getToolIcon(tool.iconName)}</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{tool.name}</div>
                <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{tool.shortDescription}</div>
                <div className="mt-3">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
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
