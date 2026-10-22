"use client";

import * as React from "react";
import { analyzeText, WordStats } from "./engine";
import { CopyButton } from "@/components/shared/CopyButton";
import { ClearButton } from "@/components/shared/ClearButton";
import { Button } from "@/components/ui/Button";
import { Clipboard, Clock, Sparkles, Upload, Download, Filter } from "lucide-react";

export function WordCounterTool() {
  const [text, setText] = React.useState("");
  const [filterStopWords, setFilterStopWords] = React.useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const stats: WordStats = React.useMemo(
    () => analyzeText(text, { filterStopWords }),
    [text, filterStopWords]
  );

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setText(content);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "word-counter-text.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 mb-6">
        <div className="rounded-xl bg-slate-50 p-3.5 text-center dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="text-2xl sm:text-3xl font-black text-ink dark:text-white">
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
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats.readingTimeFormatted}
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
            Read Time
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={handlePaste}>
            <Clipboard className="h-3.5 w-3.5" />
            <span>Paste Text</span>
          </Button>

          <Button type="button" size="sm" variant="outline" onClick={handleSampleText}>
            <Sparkles className="h-3.5 w-3.5 text-sun" />
            <span>Load Sample</span>
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.text"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            title="Upload a text or markdown file"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload .txt</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {text && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleDownloadTxt}
              title="Download text file"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Save .txt</span>
            </Button>
          )}
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
          className="w-full min-h-[260px] rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-ink/20 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:bg-slate-950 resize-y leading-relaxed font-sans"
        />
      </div>

      {/* Keyword Density & Speaking Time Bar */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>
              Speaking Time: <strong className="text-slate-800 dark:text-slate-200">{stats.speakingTimeFormatted}</strong> (~130 wpm)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stats.topKeywords.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Top Keywords:</span>
              {stats.topKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {kw.word} <span className="text-ink dark:text-white font-bold">({kw.count})</span>
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setFilterStopWords(!filterStopWords)}
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold transition-colors ${
              filterStopWords
                ? "bg-ink/10 text-ink dark:bg-white/10 dark:text-white"
                : "text-slate-400 hover:text-slate-600"
            }`}
            title="Filter out common words like 'the', 'and', 'for'"
          >
            <Filter className="h-3 w-3" />
            <span>{filterStopWords ? "Stopwords Filtered" : "All Words"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
