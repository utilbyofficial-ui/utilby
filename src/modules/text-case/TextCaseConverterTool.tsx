"use client";

import * as React from "react";
import {
  toUpperCase,
  toLowerCase,
  toTitleCase,
  toSentenceCase,
  toCapitalizedWords,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  toConstantCase,
  toInvertCase,
  removeExtraSpaces,
  removeDuplicateLines,
} from "./engine";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/shared/CopyButton";
import { ClearButton } from "@/components/shared/ClearButton";
import { Trash2, Scissors, Undo2, Upload, Download, Sparkles } from "lucide-react";

export function TextCaseConverterTool() {
  const [text, setText] = React.useState(
    "the quick brown fox jumps over the lazy dog. converting text cases has never been easier!"
  );
  const [history, setHistory] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const updateTextWithHistory = (newText: string) => {
    if (newText === text) return;
    setHistory((prev) => [...prev.slice(-19), text]);
    setText(newText);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setText(prev);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        updateTextWithHistory(content);
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
    a.download = "converted-text.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const characterCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lineCount = text.trim() ? text.split("\n").length : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Primary Transformation Toolbar */}
      <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={() => updateTextWithHistory(toUpperCase(text))}
            disabled={!text}
          >
            UPPERCASE
          </Button>

          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => updateTextWithHistory(toLowerCase(text))}
            disabled={!text}
          >
            lowercase
          </Button>

          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => updateTextWithHistory(toTitleCase(text))}
            disabled={!text}
          >
            Title Case
          </Button>

          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => updateTextWithHistory(toSentenceCase(text))}
            disabled={!text}
          >
            Sentence case
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => updateTextWithHistory(toCapitalizedWords(text))}
            disabled={!text}
          >
            Capitalize Words
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => updateTextWithHistory(toInvertCase(text))}
            disabled={!text}
          >
            tOGGLE cASE
          </Button>
        </div>

        {/* Developer & Clean Formatting Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100/70 dark:border-slate-800/70">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">Code & Slugs:</span>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => updateTextWithHistory(toCamelCase(text))}
            disabled={!text}
            title="Convert to camelCase"
          >
            camelCase
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => updateTextWithHistory(toPascalCase(text))}
            disabled={!text}
            title="Convert to PascalCase"
          >
            PascalCase
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => updateTextWithHistory(toKebabCase(text))}
            disabled={!text}
            title="Convert to kebab-case slug"
          >
            kebab-case
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => updateTextWithHistory(toSnakeCase(text))}
            disabled={!text}
            title="Convert to snake_case"
          >
            snake_case
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => updateTextWithHistory(toConstantCase(text))}
            disabled={!text}
            title="Convert to CONSTANT_CASE"
          >
            CONSTANT_CASE
          </Button>

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1" />

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => updateTextWithHistory(removeExtraSpaces(text))}
            disabled={!text}
            title="Remove extra whitespace and redundant blank lines"
          >
            <Scissors className="h-3.5 w-3.5 text-ink dark:text-slate-200" />
            <span>Clean Spaces</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => updateTextWithHistory(removeDuplicateLines(text))}
            disabled={!text}
            title="Remove duplicate lines"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
            <span>Dedupe Lines</span>
          </Button>

          {history.length > 0 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleUndo}
              className="text-amber-600 hover:text-amber-700"
              title="Undo last case transformation"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>Undo ({history.length})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Text Area */}
      <div className="mt-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your text here to convert case or format..."
          className="w-full min-h-[260px] rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-ink/20 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:bg-slate-950 leading-relaxed font-sans"
        />
      </div>

      {/* Footer Info & Actions */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>Words: <strong className="text-slate-800 dark:text-slate-200">{wordCount}</strong></span>
          <span>Characters: <strong className="text-slate-800 dark:text-slate-200">{characterCount}</strong></span>
          <span>Lines: <strong className="text-slate-800 dark:text-slate-200">{lineCount}</strong></span>
        </div>

        <div className="flex items-center gap-2">
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
            title="Load a text or markdown file"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload .txt</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleDownloadTxt}
            disabled={!text}
            title="Save as text file"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Save .txt</span>
          </Button>

          <CopyButton textToCopy={text} />
          <ClearButton onClear={() => updateTextWithHistory("")} disabled={!text} />
        </div>
      </div>
    </div>
  );
}
