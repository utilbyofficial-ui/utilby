"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-registry";
import { useLocalState } from "./useSiteAudit";
import { CopyButton, Panel } from "./ui";

interface Idea {
  id: string;
  text: string;
  done: boolean;
}

/** Steps every new tool should pass before it goes live (AdSense + SEO + privacy rules). */
export const LAUNCH_CHECKLIST = [
  "টুলটা ১০০% ব্রাউজারে চলে — কোনো ফাইল/ডেটা সার্ভারে যায় না",
  "কপিরাইট বা AdSense নিয়ম ভাঙে না (ভিডিও ডাউনলোডার/স্ক্র্যাপার নয়)",
  "tools-registry.ts-এ টুল যোগ হয়েছে, isReady: true",
  "Meta title ৬০ অক্ষরের মধ্যে, description ১২০–১৬০ অক্ষর",
  "কমপক্ষে ৩টি FAQ আর ৩ ধাপের 'How to use'",
  "পেজে ৩০০+ শব্দের কাজের লেখা (thin content নয়)",
  "OG ছবি আছে: public/og/tools/<slug>.png",
  "মোবাইলে ঠিকমতো দেখায় ও চলে",
  "টেস্ট লেখা হয়েছে, npm test আর npm run build পাস",
  "লাইভ হওয়ার পর Search Console-এ URL Inspection → Request indexing",
];

export function RoadmapPanel() {
  const soon = TOOLS.filter((t) => !t.isReady);
  const [ideas, setIdeas] = useLocalState<Idea[]>("utilby_admin_ideas", []);
  const [checked, setChecked] = useLocalState<number[]>("utilby_admin_launch_checklist", []);
  const [draft, setDraft] = React.useState("");

  const addIdea = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setIdeas([...ideas, { id: `${Date.now()}`, text, done: false }]);
    setDraft("");
  };

  const ideasText = ideas.map((i, n) => `${n + 1}. ${i.done ? "[✓] " : ""}${i.text}`).join("\n");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Panel title="রেজিস্ট্রিতে 'আসছে' টুল">
          {soon.length === 0 ? (
            <p className="text-sm text-slate-500">এই মুহূর্তে কোনো টুল অপেক্ষায় নেই।</p>
          ) : (
            <ul className="space-y-2">
              {soon.map((t) => (
                <li key={t.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="text-sm font-semibold text-ink">{t.name}</div>
                  <div className="text-xs text-slate-500">
                    {t.categoryName} · {t.shortDescription}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="টুল আইডিয়া" action={ideas.length > 0 && <CopyButton text={ideasText} label="তালিকা কপি" />}>
          <form onSubmit={addIdea} className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="যেমন: Age Calculator, Base64 Encoder…"
              aria-label="নতুন আইডিয়া"
              className="h-10 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <button type="submit" className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-soft">
              যোগ
            </button>
          </form>
          {ideas.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">আইডিয়াগুলো শুধু এই ব্রাউজারে জমা থাকে।</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {ideas.map((i) => (
                <li key={i.id} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={i.done}
                    onChange={() => setIdeas(ideas.map((x) => (x.id === i.id ? { ...x, done: !x.done } : x)))}
                    className="h-4 w-4 accent-indigo-600"
                    aria-label={`${i.text} সম্পন্ন`}
                  />
                  <span className={i.done ? "flex-1 text-sm text-slate-400 line-through" : "flex-1 text-sm text-ink"}>{i.text}</span>
                  <button
                    type="button"
                    onClick={() => setIdeas(ideas.filter((x) => x.id !== i.id))}
                    className="text-xs text-slate-400 opacity-0 hover:text-rose-600 focus:opacity-100 group-hover:opacity-100"
                    aria-label={`${i.text} মুছুন`}
                  >
                    মুছুন
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="নতুন টুল লঞ্চ চেকলিস্ট"
        action={
          checked.length > 0 && (
            <button type="button" onClick={() => setChecked([])} className="text-xs font-semibold text-slate-500 hover:text-ink">
              নতুন টুলের জন্য রিসেট
            </button>
          )
        }
      >
        <p className="mb-3 text-sm text-slate-500">
          {checked.length}/{LAUNCH_CHECKLIST.length} সম্পন্ন
        </p>
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(checked.length / LAUNCH_CHECKLIST.length) * 100}%` }} />
        </div>
        <ul className="space-y-1">
          {LAUNCH_CHECKLIST.map((item, i) => (
            <li key={i}>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={checked.includes(i)}
                  onChange={() => setChecked(checked.includes(i) ? checked.filter((x) => x !== i) : [...checked, i])}
                  className="mt-0.5 h-4 w-4 accent-emerald-600"
                />
                <span className={checked.includes(i) ? "text-sm text-slate-400 line-through" : "text-sm text-ink"}>{item}</span>
              </label>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
