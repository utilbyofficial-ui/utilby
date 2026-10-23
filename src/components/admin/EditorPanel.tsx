"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-registry";
import { CATEGORY_LANDING_PAGES } from "@/lib/category-landing";
import { CATEGORY_ORDER } from "@/lib/category-style";
import { checkDescription, checkTitle, parsePage, type SeoCheck } from "@/lib/admin/seo-audit";
import { buildChangeRequest, changedFields, FIELD_INFO, type EditableToolContent } from "@/lib/admin/change-request";
import { fetchPage, readLocal, writeLocal, type useSiteAudit } from "./useSiteAudit";
import { CopyButton, Panel, StatusDot } from "./ui";

const draftKey = (id: string) => `utilby_admin_draft_${id}`;

export function EditorPanel({
  toolId,
  onToolChange,
  audit,
}: {
  toolId: string;
  onToolChange: (id: string) => void;
  audit: ReturnType<typeof useSiteAudit>;
}) {
  const tool = TOOLS.find((t) => t.id === toolId) ?? TOOLS[0]!;
  const path = `/tools/${tool.slug}`;

  const [live, setLive] = React.useState<{ title: string; description: string } | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Live meta title/description: reuse the audit if it already fetched this page, else fetch it.
  React.useEffect(() => {
    const fromAudit = audit.pages.find((p) => p.path === path)?.parsed;
    if (fromAudit) {
      setLive({ title: fromAudit.title, description: fromAudit.description });
      return;
    }
    let alive = true;
    setLive(null);
    if (!tool.isReady) {
      setLive({ title: "", description: "" });
      return;
    }
    setLoading(true);
    fetchPage(path).then(({ html }) => {
      if (!alive) return;
      const p = html ? parsePage(html) : null;
      setLive({ title: p?.title ?? "", description: p?.description ?? "" });
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [path, tool.isReady, audit.pages]);

  const original: EditableToolContent | null = React.useMemo(
    () =>
      live && {
        name: tool.name,
        shortDescription: tool.shortDescription,
        longDescription: tool.longDescription,
        keywords: tool.keywords.join(", "),
        metaTitle: live.title,
        metaDescription: live.description,
      },
    [live, tool]
  );

  const [edited, setEdited] = React.useState<EditableToolContent | null>(null);
  React.useEffect(() => {
    if (!original) return setEdited(null);
    setEdited({ ...original, ...readLocal<Partial<EditableToolContent>>(draftKey(tool.id), {}) });
  }, [original, tool.id]);

  const update = (k: keyof EditableToolContent, v: string) => {
    if (!edited || !original) return;
    const next = { ...edited, [k]: v };
    setEdited(next);
    const changed = changedFields(original, next);
    writeLocal(draftKey(tool.id), changed.length ? Object.fromEntries(changed.map((f) => [f, next[f]])) : null);
  };

  const reset = () => {
    writeLocal(draftKey(tool.id), null);
    if (original) setEdited({ ...original });
  };

  const request = original && edited ? buildChangeRequest(tool, original, edited) : "";
  const changes = original && edited ? changedFields(original, edited) : [];

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Panel title="কনটেন্ট এডিটর" className="lg:col-span-3">
        <label className="block text-xs font-semibold text-slate-500" htmlFor="admin-tool-select">
          কোন টুল?
        </label>
        <select
          id="admin-tool-select"
          value={tool.id}
          onChange={(e) => onToolChange(e.target.value)}
          className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          {CATEGORY_ORDER.map((c) => (
            <optgroup key={c} label={CATEGORY_LANDING_PAGES[c].name}>
              {TOOLS.filter((t) => t.category === c).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.isReady ? "" : " (আসছে)"}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {(!edited || loading) && <p className="mt-6 text-sm text-slate-500">লাইভ পেজ থেকে বর্তমান লেখা আনা হচ্ছে…</p>}

        {edited && !loading && (
          <div className="mt-6 space-y-5">
            <Field label={FIELD_INFO.metaTitle.label} value={edited.metaTitle} onChange={(v) => update("metaTitle", v)} check={checkTitle(edited.metaTitle)} changed={changes.includes("metaTitle")} />
            <Field label={FIELD_INFO.metaDescription.label} value={edited.metaDescription} onChange={(v) => update("metaDescription", v)} check={checkDescription(edited.metaDescription)} changed={changes.includes("metaDescription")} multiline />
            <Field label={FIELD_INFO.name.label} value={edited.name} onChange={(v) => update("name", v)} changed={changes.includes("name")} />
            <Field label={FIELD_INFO.shortDescription.label} value={edited.shortDescription} onChange={(v) => update("shortDescription", v)} changed={changes.includes("shortDescription")} multiline />
            <Field label={FIELD_INFO.longDescription.label} value={edited.longDescription} onChange={(v) => update("longDescription", v)} changed={changes.includes("longDescription")} multiline rows={4} />
            <Field label={`${FIELD_INFO.keywords.label} (কমা দিয়ে আলাদা)`} value={edited.keywords} onChange={(v) => update("keywords", v)} changed={changes.includes("keywords")} multiline />
          </div>
        )}
      </Panel>

      <div className="space-y-6 lg:col-span-2">
        {edited && (
          <Panel title="Google প্রিভিউ">
            <div className="text-xs text-slate-500">utilby.com › tools › {tool.slug}</div>
            <div className="mt-1 line-clamp-2 text-lg leading-snug text-[#1a0dab]">{edited.metaTitle || "(টাইটেল নেই)"}</div>
            <div className="mt-1 line-clamp-3 text-sm text-slate-600">{edited.metaDescription || "(ডেসক্রিপশন নেই)"}</div>
          </Panel>
        )}

        <Panel
          title="পরিবর্তনের নির্দেশ"
          action={
            changes.length > 0 && (
              <button type="button" onClick={reset} className="text-xs font-semibold text-slate-500 hover:text-rose-600">
                সব বাতিল
              </button>
            )
          }
        >
          {!changes.length ? (
            <p className="text-sm text-slate-500">বাঁ পাশে কিছু বদলালে এখানে একটা রেডি নির্দেশ তৈরি হবে। আপনার খসড়া এই ব্রাউজারে জমা থাকে।</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-slate-600">
                {changes.length}টি পরিবর্তন। নিচের লেখাটা কপি করে Antigravity বা Claude-কে দিন — তারাই কোডে বসিয়ে লাইভ করবে।
              </p>
              <textarea readOnly value={request} rows={12} className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-700" />
              <CopyButton text={request} label="নির্দেশ কপি করুন" className="mt-3" />
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  check,
  changed,
  multiline,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  check?: SeoCheck;
  changed?: boolean;
  multiline?: boolean;
  rows?: number;
}) {
  const id = React.useId();
  const cls = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-xs font-semibold text-slate-500">
          {label}
          {changed && <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700">বদলানো</span>}
        </label>
        <span className="text-xs tabular-nums text-slate-400">{[...value].length}</span>
      </div>
      {multiline ? (
        <textarea id={id} value={value} rows={rows} onChange={(e) => onChange(e.target.value)} className={cls} />
      ) : (
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
      {check && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
          <StatusDot status={check.status} />
          {check.detail}
        </div>
      )}
    </div>
  );
}
