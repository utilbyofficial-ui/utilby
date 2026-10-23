"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-registry";
import { SITE_ORIGIN, type PageAudit, type PageKind } from "@/lib/admin/seo-audit";
import { cn } from "@/lib/utils";
import type { useSiteAudit } from "./useSiteAudit";
import { Panel, ScorePill, StatusDot, StatusText } from "./ui";

const KIND_LABEL: Record<PageKind, string> = {
  home: "হোম",
  directory: "সব টুল",
  category: "ক্যাটাগরি",
  tool: "টুল",
  info: "তথ্য পেজ",
};

export function SeoPanel({ audit, onEdit }: { audit: ReturnType<typeof useSiteAudit>; onEdit: (toolId: string) => void }) {
  const [onlyIssues, setOnlyIssues] = React.useState(true);
  const [open, setOpen] = React.useState<string | null>(null);

  const rows = [...audit.pages]
    .filter((p) => !onlyIssues || p.checks.some((c) => c.status !== "pass"))
    .sort((a, b) => a.score - b.score);

  return (
    <Panel
      title="SEO ও AdSense চেক"
      action={
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
            শুধু সমস্যাওয়ালা পেজ
          </label>
          <button
            type="button"
            onClick={audit.run}
            disabled={audit.running}
            className="inline-flex h-9 items-center rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-semibold text-ink hover:bg-slate-50 disabled:opacity-50"
          >
            {audit.running ? `চেক চলছে ${audit.progress.done}/${audit.progress.total}…` : "আবার চেক করুন"}
          </button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-slate-500">
        sitemap.xml-এর প্রতিটা পেজ খুলে দেখা হয় Google ঠিক কী দেখছে — টাইটেল, ডেসক্রিপশন, FAQ, কনটেন্টের পরিমাণ ইত্যাদি।
        {audit.finishedAt && <> শেষ চেক: {audit.finishedAt.toLocaleTimeString()}।</>}
      </p>

      {audit.error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{audit.error}</p>}
      {!audit.pages.length && !audit.error && <p className="text-sm text-slate-500">চেক হচ্ছে…</p>}
      {!!audit.pages.length && !rows.length && <p className="text-sm text-emerald-700">সব পেজ ঠিক আছে 🎉</p>}

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {rows.map((p) => (
          <PageRow key={p.path} page={p} open={open === p.path} onToggle={() => setOpen(open === p.path ? null : p.path)} onEdit={onEdit} />
        ))}
      </ul>
    </Panel>
  );
}

function PageRow({ page, open, onToggle, onEdit }: { page: PageAudit; open: boolean; onToggle: () => void; onEdit: (toolId: string) => void }) {
  const fails = page.checks.filter((c) => c.status === "fail").length;
  const warns = page.checks.filter((c) => c.status === "warn").length;
  const tool = page.kind === "tool" ? TOOLS.find((t) => `/tools/${t.slug}` === page.path) : undefined;
  const liveUrl = SITE_ORIGIN + (page.path === "/" ? "/" : page.path);

  return (
    <li>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
        <ScorePill score={page.score} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink">{page.parsed?.h1[0] || page.path}</div>
          <div className="truncate text-xs text-slate-500">
            {KIND_LABEL[page.kind]} · {page.path}
          </div>
        </div>
        <div className="hidden shrink-0 text-xs text-slate-500 sm:block">
          {fails > 0 && <span className="mr-3 font-semibold text-rose-600">{fails} সমস্যা</span>}
          {warns > 0 && <span className="font-semibold text-amber-600">{warns} উন্নতি</span>}
        </div>
        <span aria-hidden className={cn("text-slate-400 transition", open && "rotate-90")}>›</span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 px-4 py-4">
          {page.parsed && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Google-এ যেমন দেখাবে</div>
              <div className="mt-2 truncate text-xs text-slate-500">utilby.com{page.path === "/" ? "" : ` › ${page.path.split("/").filter(Boolean).join(" › ")}`}</div>
              <div className="mt-0.5 line-clamp-1 text-lg text-[#1a0dab]">{page.parsed.title || "(টাইটেল নেই)"}</div>
              <div className="mt-0.5 line-clamp-2 text-sm text-slate-600">{page.parsed.description || "(ডেসক্রিপশন নেই)"}</div>
            </div>
          )}
          <ul className="space-y-2">
            {page.checks.map((c) => (
              <li key={c.id} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5">
                  <StatusDot status={c.status} />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-ink">{c.label}</span> <StatusText status={c.status} />
                  <div className="break-words text-xs text-slate-500">{c.detail}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {tool && (
              <button type="button" onClick={() => onEdit(tool.id)} className="rounded-xl bg-ink px-3.5 py-2 text-xs font-semibold text-white hover:bg-ink-soft">
                কনটেন্ট এডিট করুন
              </button>
            )}
            <a href={page.path} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-ink hover:bg-slate-50">
              পেজ খুলুন ↗
            </a>
            <a href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(liveUrl)}`} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-ink hover:bg-slate-50">
              স্পিড টেস্ট ↗
            </a>
            <a href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(liveUrl)}`} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-ink hover:bg-slate-50">
              Rich Results টেস্ট ↗
            </a>
          </div>
        </div>
      )}
    </li>
  );
}
