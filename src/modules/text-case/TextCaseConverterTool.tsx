"use client";

import * as React from "react";
import {
  toUpperCase,
  toLowerCase,
  toTitleCase,
  toSentenceCase,
  toCapitalizedWords,
  removeExtraSpaces,
  removeDuplicateLines,
} from "./engine";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/shared/CopyButton";
import { ClearButton } from "@/components/shared/ClearButton";
import { Sparkles, Trash2, Scissors } from "lucide-react";

export function TextCaseConverterTool() {
  const [text, setText] = React.useState(
    "the quick brown fox jumps over the lazy dog. converting text cases has never been easier!"
  );

  const characterCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lineCount = text.trim() ? text.split("\n").length : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Transformation Toolbar */}
      <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={() => setText(toUpperCase(text))}
          disabled={!text}
        >
          UPPERCASE
        </Button>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setText(toLowerCase(text))}
          disabled={!text}
        >
          lowercase
        </Button>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setText(toTitleCase(text))}
          disabled={!text}
        >
          Title Case
        </Button>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setText(toSentenceCase(text))}
          disabled={!text}
        >
          Sentence case
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setText(toCapitalizedWords(text))}
          disabled={!text}
        >
          Capitalize Words
        </Button>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1" />

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setText(removeExtraSpaces(text))}
          disabled={!text}
          title="Remove extra whitespace and empty lines"
        >
          <Scissors className="h-3.5 w-3.5 text-indigo-500" />
          <span>Clean Spaces</span>
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setText(removeDuplicateLines(text))}
          disabled={!text}
          title="Remove duplicate lines"
        >
          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
          <span>Remove Duplicate Lines</span>
        </Button>
      </div>

      {/* Text Area */}
      <div className="mt-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your text here to convert case or format..."
          className="w-full min-h-[260px] rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:bg-slate-950 leading-relaxed font-sans"
        />
      </div>

      {/* Footer Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>Words: <strong className="text-slate-800 dark:text-slate-200">{wordCount}</strong></span>
          <span>Characters: <strong className="text-slate-800 dark:text-slate-200">{characterCount}</strong></span>
          <span>Lines: <strong className="text-slate-800 dark:text-slate-200">{lineCount}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <CopyButton textToCopy={text} />
          <ClearButton onClear={() => setText("")} disabled={!text} />
        </div>
      </div>
    </div>
  );
}
