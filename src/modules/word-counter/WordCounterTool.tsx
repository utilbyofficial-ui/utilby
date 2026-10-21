"use client";

import * as React from "react";
import { analyzeText, WordStats } from "./engine";
import { CopyButton } from "@/components/shared/CopyButton";
import { ClearButton } from "@/components/shared/ClearButton";
import { Button } from "@/components/ui/Button";
import { Clipboard, Clock, AlignLeft, Sparkles } from "lucide-react";

export function WordCounterTool() {
  const [text, setText] = React.useState("");
  const stats: WordStats = React.useMemo(() => analyzeText(text), [text]);

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
    } catch {
      // Fallback
    }
  };

  const handleSampleText = () => {
    setText(
      "Utilby provides fast, free, and secure online tools for everyday digital tasks. All calculations and text transformations are performed locally within your browser. This ensures total data privacy, instantaneous response times, and an enjoyable user experience without bloated server delays."
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 mb-6">
        <div className="rounded-xl bg-slate-50 p-3.5 text-center dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {stats.words.toLocaleString()}
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
            Words
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3.5 text-center dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats.characters.toLocaleString()}
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
            Characters
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3.5 text-center dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats.charactersNoSpaces.toLocaleString()}
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
            No Spaces
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3.5 text-center dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats.sentences.toLocaleString()}
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
            Sentences
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3.5 text-center dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats.paragraphs.toLocaleString()}
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
            Paragraphs
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3.5 text-center dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-1">
            <span>{stats.readingTimeMinutes}</span>
            <span className="text-xs font-normal text-slate-400">min</span>
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
            Read Time
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={handlePaste}>
            <Clipboard className="h-3.5 w-3.5" />
            <span>Paste Text</span>
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={handleSampleText}>
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>Load Sample</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <ClearButton onClear={() => setText("")} disabled={!text} />
          <CopyButton textToCopy={text} />
        </div>
      </div>

      {/* Main Textarea */}
      <div className="mt-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your text here to inspect word count, characters, sentences, reading time, and keyword density..."
          className="w-full min-h-[260px] rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:bg-slate-950 resize-y leading-relaxed font-sans"
        />
      </div>

      {/* Keyword Density & Speaking Time Bar */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-indigo-500" />
            <span>
              Speaking Time: <strong className="text-slate-800 dark:text-slate-200">{stats.speakingTimeMinutes} min</strong> (~130 wpm)
            </span>
          </div>
        </div>

        {stats.topKeywords.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Top Keywords:</span>
            {stats.topKeywords.map((kw, i) => (
              <span
                key={i}
                className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {kw.word} <span className="text-indigo-600 dark:text-indigo-400 font-bold">({kw.count})</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
