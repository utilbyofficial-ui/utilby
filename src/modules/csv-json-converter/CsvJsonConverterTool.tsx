"use client";

import * as React from "react";
import { ArrowLeftRight, CheckCircle2, Download, FileText, RotateCcw, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/shared/CopyButton";
import {
  cleanConversionFilename,
  convertCsvToJson,
  convertJsonToCsv,
  MAX_CSV_JSON_BYTES,
  type CsvDelimiterOption,
} from "./engine";

type ConversionMode = "csv-to-json" | "json-to-csv";
interface ConversionOutput {
  text: string;
  rowCount: number;
  columnCount?: number;
  delimiter?: string;
}

const CSV_SAMPLE = 'name,email,city\n"Rafi Rahman",rafi@example.com,"Dhaka, Bangladesh"\nMaya,maya@example.com,Chattogram';
const JSON_SAMPLE = JSON.stringify([
  { name: "Rafi Rahman", email: "rafi@example.com", city: "Dhaka, Bangladesh" },
  { name: "Maya", email: "maya@example.com", city: "Chattogram" },
], null, 2);

function downloadText(text: string, filename: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CsvJsonConverterTool() {
  const [mode, setMode] = React.useState<ConversionMode>("csv-to-json");
  const [inputText, setInputText] = React.useState("");
  const [delimiter, setDelimiter] = React.useState<CsvDelimiterOption>("auto");
  const [firstRowIsHeader, setFirstRowIsHeader] = React.useState(true);
  const [output, setOutput] = React.useState<ConversionOutput | null>(null);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [uploadMessage, setUploadMessage] = React.useState("");
  const [filename, setFilename] = React.useState("converted-data");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isCsvToJson = mode === "csv-to-json";
  const outputExtension = isCsvToJson ? "json" : "csv";
  const inputByteLength = React.useMemo(() => new TextEncoder().encode(inputText).byteLength, [inputText]);

  const clearResult = () => {
    setOutput(null);
    setErrorMessage("");
  };

  const convert = () => {
    clearResult();
    if (!inputText.trim()) {
      setErrorMessage("Paste some data or choose a file to get started.");
      return;
    }
    if (new TextEncoder().encode(inputText).byteLength > MAX_CSV_JSON_BYTES) {
      setErrorMessage("Keep the input under 5 MB so conversion stays responsive in your browser.");
      return;
    }

    try {
      if (isCsvToJson) {
        const result = convertCsvToJson(inputText, delimiter, firstRowIsHeader);
        setOutput({ ...result, columnCount: result.text === "[]" ? 0 : undefined });
      } else {
        setOutput(convertJsonToCsv(inputText));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The data could not be converted. Check its format and try again.");
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    setUploadMessage("");
    clearResult();
    if (selected.size > MAX_CSV_JSON_BYTES) {
      setUploadMessage("Choose a file smaller than 5 MB.");
      return;
    }
    try {
      const text = await selected.text();
      setInputText(text);
      setFilename(cleanConversionFilename(selected.name));
      setUploadMessage(`${selected.name} is ready. Select Convert to preview the result.`);
    } catch {
      setUploadMessage("This file could not be read. Try another CSV or JSON file.");
    }
  };

  const loadSample = () => {
    setInputText(isCsvToJson ? CSV_SAMPLE : JSON_SAMPLE);
    setFilename("sample-data");
    setUploadMessage("Example loaded. Select Convert to see the result.");
    clearResult();
  };

  const changeMode = (nextMode: ConversionMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setInputText("");
    setFilename("converted-data");
    setUploadMessage("");
    clearResult();
  };

  const handleDownload = () => {
    if (!output) return;
    const content = outputExtension === "csv" ? `\uFEFF${output.text}` : output.text;
    downloadText(content, `${filename}.${outputExtension}`, outputExtension === "csv" ? "text/csv;charset=utf-8" : "application/json;charset=utf-8");
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" aria-label="CSV and JSON converter">
      <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 via-white to-sky-50 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-violet-700">Data converter</p>
            <h2 className="mt-1 font-display text-xl font-extrabold text-ink sm:text-2xl">Convert between CSV and JSON</h2>
            <p className="mt-1 text-sm text-slate-600">Bring spreadsheet rows into JSON, or make JSON data ready for a spreadsheet.</p>
          </div>
          <div className="inline-flex w-full rounded-2xl border border-slate-200 bg-white p-1 shadow-sm sm:w-auto" role="group" aria-label="Conversion direction">
            <button
              type="button"
              aria-pressed={isCsvToJson}
              onClick={() => changeMode("csv-to-json")}
              className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-bold transition sm:flex-none ${isCsvToJson ? "bg-ink text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
            >CSV → JSON</button>
            <button
              type="button"
              aria-pressed={!isCsvToJson}
              onClick={() => changeMode("json-to-csv")}
              className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-bold transition sm:flex-none ${!isCsvToJson ? "bg-ink text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
            >JSON → CSV</button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={isCsvToJson ? ".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain" : ".json,application/json,text/json"}
            className="hidden"
            onChange={(event) => void handleUpload(event)}
            aria-label={`Choose ${isCsvToJson ? "CSV" : "JSON"} file`}
          />
          <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> Choose file
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={loadSample}>
            <FileText className="h-3.5 w-3.5" /> Try example
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => {
            setInputText("");
            setFilename("converted-data");
            setUploadMessage("");
            clearResult();
          }} disabled={!inputText && !output && !uploadMessage}>
            <RotateCcw className="h-3.5 w-3.5" /> Clear
          </Button>
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <ShieldCheck className="h-4 w-4" /> Stays on your device
          </span>
        </div>

        {uploadMessage && <p role="status" className="mb-3 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs font-medium text-sky-800">{uploadMessage}</p>}

        {isCsvToJson && (
          <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl bg-slate-50 p-3.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              Separator
              <select
                value={delimiter}
                onChange={(event) => { setDelimiter(event.target.value as CsvDelimiterOption); clearResult(); }}
                className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-ink focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              >
                <option value="auto">Detect automatically</option>
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value={"\t"}>Tab</option>
                <option value="|">Pipe (|)</option>
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={firstRowIsHeader}
                onChange={(event) => { setFirstRowIsHeader(event.target.checked); clearResult(); }}
                className="h-4 w-4 rounded border-slate-300 accent-violet-600"
              />
              First row contains column names
            </label>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="min-w-0">
            <div className="mb-2 flex items-center justify-between gap-2">
              <label htmlFor="csv-json-input" className="text-sm font-bold text-ink">{isCsvToJson ? "CSV input" : "JSON input"}</label>
              <span className="text-[11px] text-slate-500">{formatBytes(inputByteLength)} / 5 MB</span>
            </div>
            <textarea
              id="csv-json-input"
              value={inputText}
              onChange={(event) => { setInputText(event.target.value); setUploadMessage(""); clearResult(); }}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder={isCsvToJson ? "Paste CSV rows here…" : 'Paste a JSON array of objects or arrays…'}
              className="min-h-[300px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 placeholder:text-slate-500 focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100 sm:min-h-[370px]"
            />
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex min-h-5 items-center justify-between gap-2">
              <span className="text-sm font-bold text-ink">{isCsvToJson ? "JSON result" : "CSV result"}</span>
              {output && <span className="text-[11px] text-slate-500">{output.rowCount} row{output.rowCount === 1 ? "" : "s"}{output.columnCount ? ` · ${output.columnCount} columns` : ""}</span>}
            </div>
            {output ? (
              <pre aria-label={`${outputExtension.toUpperCase()} result`} className="min-h-[300px] max-h-[520px] overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-800 sm:min-h-[370px]">{output.text || <span className="text-slate-400">No rows to show.</span>}</pre>
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center sm:min-h-[370px]">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm"><ArrowLeftRight className="h-5 w-5" /></span>
                <p className="mt-3 text-sm font-bold text-slate-700">Your converted data will appear here</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">Choose a file or paste data, then press Convert to preview it before saving.</p>
              </div>
            )}
          </div>
        </div>

        {errorMessage && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">{errorMessage}</p>}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> CSV fields stay as text; no automatic number or date changes.</p>
          <div className="flex flex-wrap items-center gap-2">
            {output && <CopyButton textToCopy={output.text} label="Copy result" />}
            {output && <Button type="button" size="sm" variant="outline" onClick={handleDownload}><Download className="h-3.5 w-3.5" /> Save .{outputExtension}</Button>}
            <Button type="button" size="md" onClick={convert} disabled={!inputText.trim()}><ArrowLeftRight className="h-4 w-4" /> Convert</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
