"use client";

import * as React from "react";
import Link from "next/link";
import { TOOLS } from "@/lib/tools-registry";
import { CATEGORY_LANDING_PAGES } from "@/lib/category-landing";
import { CATEGORY_ORDER, CATEGORY_STYLES } from "@/lib/category-style";
import { cn } from "@/lib/utils";
import type { PageAudit } from "@/lib/admin/seo-audit";
import { useAccessStatus, useSiteAudit, type AccessStatus } from "./useSiteAudit";
import { Panel, ScorePill, Stat, StatusDot } from "./ui";
import { SeoPanel } from "./SeoPanel";
import { EditorPanel } from "./EditorPanel";
import { RoadmapPanel } from "./RoadmapPanel";
import { LinksPanel } from "./LinksPanel";

type Tab = "overview" | "seo" | "editor" | "roadmap" | "links";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "ওভারভিউ" },
  { id: "seo", label: "SEO ও AdSense চেক" },
  { id: "editor", label: "কনটেন্ট এডিটর" },
  { id: "roadmap", label: "রোডম্যাপ ও চেকলিস্ট" },
  { id: "links", label: "লিংক ও সিকিউরিটি" },
];

export function AdminDashboard() {
  const [tab, setTab] = React.useState<Tab>("overview");
  const [editorToolId, setEditorToolId] = React.useState<string>(TOOLS.find((t) => t.isReady)?.id ?? TOOLS[0]!.id);
  const audit = useSiteAudit();
  const access = useAccessStatus();
  const { run } = audit;

  React.useEffect(() => {
    run();
  }, [run]);

  React.useEffect(() => {
    const fromHash = window.location.hash.slice(1) as Tab;
    if (TABS.some((t) => t.id === fromHash)) setTab(fromHash);
  }, []);

  const go = (t: Tab) => {
    setTab(t);
    try {
      window.history.replaceState(null, "", `#${t}`);
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openInEditor = (toolId: string) => {
    setEditorToolId(toolId);
    go("editor");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Owner Dashboard</div>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink">Utilby কন্ট্রোল প্যানেল</h1>
          <p className="mt-1 text-sm text-slate-500">সাইটের স্বাস্থ্য, কনটেন্ট আর পরের কাজ — সব এক জায়গায়। সব হিসাব আপনার ব্রাউজারেই হয়।</p>
        </div>
        <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-ink">
          ← সাইটে ফিরে যান
        </Link>
      </div>

      <AccessBanner status={access} onSetup={() => go("links")} />

      <nav aria-label="Dashboard sections" className="sticky top-[72px] z-20 -mx-4 mt-6 overflow-x-auto border-b border-slate-200 bg-slate-50/95 px-4 backdrop-blur sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => go(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={cn(
                "relative px-3.5 py-3 text-sm font-semibold transition",
                tab === t.id ? "text-ink" : "text-slate-500 hover:text-ink"
              )}
            >
              {t.label}
              {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-indigo-600" />}
            </button>
          ))}
        </div>
      </nav>

      <div className="mt-6">
        {tab === "overview" && <Overview audit={audit} onGo={go} />}
        {tab === "seo" && <SeoPanel audit={audit} onEdit={openInEditor} />}
        {tab === "editor" && <EditorPanel toolId={editorToolId} onToolChange={setEditorToolId} audit={audit} />}
        {tab === "roadmap" && <RoadmapPanel />}
        {tab === "links" && <LinksPanel access={access} />}
      </div>
    </div>
  );
}

function AccessBanner({ status, onSetup }: { status: AccessStatus; onSetup: () => void }) {
  if (status === "checking") return null;
  if (status === "protected") {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <span aria-hidden>🔒</span>
        <span>এই পেজ Cloudflare Access দিয়ে লক করা — শুধু আপনি ঢুকতে পারেন।</span>
      </div>
    );
  }
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="flex items-center gap-3">
        <span aria-hidden>⚠️</span>
        <span>
          {status === "open"
            ? "এই পেজটা এখনো খোলা — লিংক জানলে যে কেউ দেখতে পারবে (কোনো গোপন তথ্য নেই, তবু লক করে রাখা ভালো)।"
            : "লক আছে কিনা নিশ্চিত হওয়া গেল না।"}
        </span>
      </div>
      <button type="button" onClick={onSetup} className="rounded-xl bg-ink px-3.5 py-2 text-xs font-semibold text-white hover:bg-ink-soft">
        কীভাবে লক করবেন →
      </button>
    </div>
  );
}

function Overview({ audit, onGo }: { audit: ReturnType<typeof useSiteAudit>; onGo: (t: Tab) => void }) {
  const ready = TOOLS.filter((t) => t.isReady);
  const soon = TOOLS.filter((t) => !t.isReady);
  const byCategory = CATEGORY_ORDER.map((id) => ({
    id,
    name: CATEGORY_LANDING_PAGES[id].name,
    ready: ready.filter((t) => t.category === id).length,
    soon: soon.filter((t) => t.category === id).length,
  }));
  const max = Math.max(...byCategory.map((c) => c.ready + c.soon), 1);

  const pages = audit.pages;
  const avg = pages.length ? Math.round(pages.reduce((s, p) => s + p.score, 0) / pages.length) : null;
  const fails = pages.reduce((s, p) => s + p.checks.filter((c) => c.status === "fail").length, 0);
  const warns = pages.reduce((s, p) => s + p.checks.filter((c) => c.status === "warn").length, 0);

  const topIssues = pages
    .flatMap((p) => p.checks.filter((c) => c.status !== "pass").map((c) => ({ page: p, check: c })))
    .sort((a, b) => (a.check.status === b.check.status ? 0 : a.check.status === "fail" ? -1 : 1))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="লাইভ টুল" value={ready.length} hint={`${CATEGORY_ORDER.length}টি ক্যাটাগরিতে`} tone="good" />
        <Stat label="আসছে (Coming soon)" value={soon.length} hint="রেজিস্ট্রিতে আছে, এখনো লাইভ না" />
        <Stat
          label="গড় SEO স্কোর"
          value={avg === null ? "…" : avg}
          hint={audit.running ? `চেক চলছে ${audit.progress.done}/${audit.progress.total}` : `${pages.length}টি পেজ চেক হয়েছে`}
          tone={avg === null ? "ink" : avg >= 90 ? "good" : avg >= 70 ? "warn" : "bad"}
        />
        <Stat label="ঠিক করার মতো" value={audit.running && !pages.length ? "…" : fails + warns} hint={`${fails}টি সমস্যা · ${warns}টি উন্নতি`} tone={fails ? "bad" : warns ? "warn" : "good"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="ক্যাটাগরি ব্যালান্স" className="lg:col-span-3">
          <ul className="space-y-3">
            {byCategory.map((c) => (
              <li key={c.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">{c.name}</span>
                  <span className="text-slate-500 tabular-nums">
                    {c.ready} লাইভ{c.soon ? ` · ${c.soon} আসছে` : ""}
                    {c.ready <= 1 && <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">টুল কম</span>}
                  </span>
                </div>
                <div className="mt-1.5 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div style={{ width: `${(c.ready / max) * 100}%`, background: CATEGORY_STYLES[c.id].hex }} />
                  <div style={{ width: `${(c.soon / max) * 100}%`, background: CATEGORY_STYLES[c.id].hex, opacity: 0.3 }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">যে ক্যাটাগরিতে ১টা টুল, সেখানে আরও টুল যোগ করলে ক্যাটাগরি পেজ শক্ত হয় আর Google ভালো র‍্যাংক দেয়।</p>
        </Panel>

        <Panel
          title="সবচেয়ে জরুরি কাজ"
          className="lg:col-span-2"
          action={
            <button type="button" onClick={() => onGo("seo")} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              সব দেখুন →
            </button>
          }
        >
          {audit.error && <p className="text-sm text-rose-600">{audit.error}</p>}
          {!audit.error && !pages.length && <p className="text-sm text-slate-500">সাইট চেক হচ্ছে…</p>}
          {!!pages.length && !topIssues.length && <p className="text-sm text-emerald-700">দারুণ! কোনো সমস্যা পাওয়া যায়নি।</p>}
          <ul className="space-y-3">
            {topIssues.map(({ page, check }, i) => (
              <li key={i} className="flex gap-3">
                <StatusDot status={check.status} />
                <div className="-mt-1 min-w-0 text-sm">
                  <div className="font-semibold text-ink">
                    {check.label} <span className="font-normal text-slate-400">· {page.path}</span>
                  </div>
                  <div className="text-xs text-slate-500">{check.detail}</div>
                </div>
              </li>
            ))}
          </ul>
          {audit.missingFromSitemap.length > 0 && (
            <p className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">sitemap.xml-এ নেই: {audit.missingFromSitemap.join(", ")}</p>
          )}
        </Panel>
      </div>

      <Panel title="পেজের স্কোর">
        <PageScoreGrid pages={pages} />
      </Panel>
    </div>
  );
}

function PageScoreGrid({ pages }: { pages: PageAudit[] }) {
  if (!pages.length) return <p className="text-sm text-slate-500">চেক শেষ হলে এখানে প্রতিটা পেজের স্কোর দেখাবে।</p>;
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {[...pages]
        .sort((a, b) => a.score - b.score)
        .map((p) => (
          <a key={p.path} href={p.path} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:border-indigo-300">
            <span className="truncate text-slate-700">{p.path}</span>
            <ScorePill score={p.score} />
          </a>
        ))}
    </div>
  );
}
