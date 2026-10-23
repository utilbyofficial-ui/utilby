"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { CheckStatus } from "@/lib/admin/seo-audit";

export function Panel({ title, action, children, className }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-display text-lg font-bold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone = "ink" }: { label: string; value: React.ReactNode; hint?: string; tone?: "ink" | "good" | "warn" | "bad" }) {
  const toneClass = { ink: "text-ink", good: "text-emerald-600", warn: "text-amber-600", bad: "text-rose-600" }[tone];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={cn("mt-2 font-display text-3xl font-bold", toneClass)}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

const STATUS_STYLE: Record<CheckStatus, { dot: string; text: string; label: string }> = {
  pass: { dot: "bg-emerald-500", text: "text-emerald-700", label: "ঠিক আছে" },
  warn: { dot: "bg-amber-400", text: "text-amber-700", label: "উন্নতি দরকার" },
  fail: { dot: "bg-rose-500", text: "text-rose-700", label: "সমস্যা" },
};

export function StatusDot({ status }: { status: CheckStatus }) {
  return <span aria-label={STATUS_STYLE[status].label} className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", STATUS_STYLE[status].dot)} />;
}

export function StatusText({ status }: { status: CheckStatus }) {
  return <span className={cn("text-xs font-semibold", STATUS_STYLE[status].text)}>{STATUS_STYLE[status].label}</span>;
}

export function ScorePill({ score }: { score: number }) {
  const cls = score >= 90 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : score >= 70 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200";
  return <span className={cn("inline-flex min-w-[3.25rem] justify-center rounded-full border px-2 py-0.5 text-xs font-bold tabular-nums", cls)}>{score}</span>;
}

export function CopyButton({ text, label = "কপি করুন", className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      disabled={!text}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-xl bg-ink px-3.5 text-xs font-semibold text-white transition hover:bg-ink-soft disabled:opacity-40",
        className
      )}
    >
      {copied ? "কপি হয়েছে ✓" : label}
    </button>
  );
}

export function ExternalLinkItem({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/40"
    >
      <div>
        <div className="text-sm font-semibold text-ink">{title}</div>
        <div className="mt-0.5 text-xs text-slate-500">{desc}</div>
      </div>
      <span aria-hidden className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600">↗</span>
    </a>
  );
}
