"use client";

import * as React from "react";
import { validateAndFormatJson, minifyJson, SAMPLE_JSON, JsonValidationResult } from "./engine";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/shared/CopyButton";
import { ClearButton } from "@/components/shared/ClearButton";
import { Download, AlertCircle, CheckCircle2, Sparkles, Minimize, Maximize } from "lucide-react";

export function JsonFormatterTool() {
  const [inputJson, setInputJson] = React.useState(SAMPLE_JSON);
  const [indent, setIndent] = React.useState<number>(2);
  const [status, setStatus] = React.useState<JsonValidationResult>({ isValid: true, output: "" });

  // Initial format on load
  React.useEffect(() => {
    const res = validateAndFormatJson(SAMPLE_JSON, 2);
    setStatus(res);
  }, []);

  const handleFormat = (customIndent = indent) => {
    const res = validateAndFormatJson(inputJson, customIndent);
    setStatus(res);
    if (res.isValid && res.output) {
      setInputJson(res.output);
    }
  };

  const handleMinify = () => {
    const res = minifyJson(inputJson);
    setStatus(res);
    if (res.isValid && res.output) {
      setInputJson(res.output);
    }
  };

  const handleValidate = () => {
    const res = validateAndFormatJson(inputJson, indent);
    setStatus(res);
  };

  const handleDownload = () => {
    const blob = new Blob([inputJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={() => handleFormat(indent)}
            disabled={!inputJson.trim()}
          >
            <Maximize className="h-3.5 w-3.5" />
            <span>Beautify / Format</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleMinify}
            disabled={!inputJson.trim()}
          >
            <Minimize className="h-3.5 w-3.5" />
            <span>Minify</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleValidate}
            disabled={!inputJson.trim()}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Validate</span>
          </Button>

          <select
            value={indent}
            onChange={(e) => {
              const val = Number(e.target.value);
              setIndent(val);
              handleFormat(val);
            }}
            className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value={2}>2 Spaces Indent</option>
            <option value={4}>4 Spaces Indent</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setInputJson(SAMPLE_JSON);
              handleFormat(indent);
            }}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>Sample</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleDownload}
            disabled={!inputJson.trim()}
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download .json</span>
          </Button>

          <CopyButton textToCopy={inputJson} />
          <ClearButton
            onClear={() => {
              setInputJson("");
              setStatus({ isValid: true, output: "" });
            }}
            disabled={!inputJson}
          />
        </div>
      </div>

      {/* Editor & Validation Feedback */}
      <div className="mt-4 space-y-3">
        {/* Status Notification */}
        {inputJson.trim() !== "" && (
          <div>
            {status.isValid ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Valid JSON Syntax</span>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    Invalid JSON: {status.error?.message}
                  </span>
                </div>
                {status.error?.line && (
                  <span className="rounded bg-rose-200/80 px-2 py-0.5 text-[11px] font-bold text-rose-900 dark:bg-rose-900 dark:text-rose-100">
                    Line {status.error.line}, Col {status.error.column || 1}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <textarea
          value={inputJson}
          onChange={(e) => {
            setInputJson(e.target.value);
            // Dynamic validation on typing
            const res = validateAndFormatJson(e.target.value, indent);
            setStatus(res);
          }}
          placeholder="Paste or type JSON data here..."
          className="w-full min-h-[360px] rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-sm text-emerald-400 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 leading-relaxed"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
