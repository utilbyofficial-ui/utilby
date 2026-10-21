"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Code2,
  Percent,
  Type,
  ShieldCheck,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  Zap,
  Lock,
  RefreshCw,
  Sliders,
} from "lucide-react";

export function DedicatedToolsShowcase() {
  const [activeTab, setActiveTab] = useState<string>("word-counter");

  // Word Counter State
  const [wordText, setWordText] = useState(
    "Utilby is a modern network of free online utilities built with client-side privacy in mind."
  );

  // JSON Formatter State
  const [jsonInput, setJsonInput] = useState(
    '{"product":"Utilby","privacy":"100% Client-Side","speed":"instant","tools":5}'
  );
  const [jsonOutput, setJsonOutput] = useState("");
  const [jsonStatus, setJsonStatus] = useState<"idle" | "valid" | "invalid">("idle");

  // Percentage Calc State
  const [pctVal1, setPctVal1] = useState<number>(20);
  const [pctVal2, setPctVal2] = useState<number>(250);

  // Case Converter State
  const [caseText, setCaseText] = useState("the quick brown fox jumps over the lazy dog");

  // Password Generator State
  const [passLength, setPassLength] = useState<number>(16);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [generatedPass, setGeneratedPass] = useState<string>("k9#Mv$82!pQx&49Lm");
  const [copied, setCopied] = useState<boolean>(false);

  // Word counter calculations
  const words = wordText.trim() ? wordText.trim().split(/\s+/).filter(Boolean).length : 0;
  const chars = wordText.length;
  const charsNoSpaces = wordText.replace(/\s/g, "").length;
  const sentences = wordText.split(/[.!?]+/).filter(Boolean).length;
  const readTimeSec = Math.ceil((words / 200) * 60);

  // JSON formatting action
  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, 2));
      setJsonStatus("valid");
    } catch {
      setJsonStatus("invalid");
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed));
      setJsonStatus("valid");
    } catch {
      setJsonStatus("invalid");
    }
  };

  // Generate password action
  const generateNewPassword = () => {
    const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";
    const syms = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    let pool = letters;
    if (includeNumbers) pool += nums;
    if (includeSymbols) pool += syms;

    let res = "";
    const arr = new Uint32Array(passLength);
    if (typeof window !== "undefined" && window.crypto) {
      window.crypto.getRandomValues(arr);
      for (let i = 0; i < passLength; i++) {
        res += pool[arr[i] % pool.length];
      }
    } else {
      for (let i = 0; i < passLength; i++) {
        res += pool.charAt(Math.floor(Math.random() * pool.length));
      }
    }
    setGeneratedPass(res);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toolsList = [
    {
      id: "word-counter",
      name: "Word Counter",
      icon: <FileText className="h-4 w-4" />,
      color: "text-indigo-600",
      slug: "word-counter",
    },
    {
      id: "json-formatter",
      name: "JSON Formatter",
      icon: <Code2 className="h-4 w-4" />,
      color: "text-emerald-600",
      slug: "json-formatter",
    },
    {
      id: "percentage-calculator",
      name: "Percentage Calculator",
      icon: <Percent className="h-4 w-4" />,
      color: "text-amber-600",
      slug: "percentage-calculator",
    },
    {
      id: "text-case-converter",
      name: "Text Case Converter",
      icon: <Type className="h-4 w-4" />,
      color: "text-violet-600",
      slug: "text-case-converter",
    },
    {
      id: "password-generator",
      name: "Password Generator",
      icon: <ShieldCheck className="h-4 w-4" />,
      color: "text-teal-600",
      slug: "password-generator",
    },
  ];

  return (
    <section className="py-14 sm:py-20 bg-white border-y border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3.5 py-1 text-xs font-semibold text-indigo-700 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Interactive Live Workspaces</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Try Any Tool Instantly Below
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Click any tool tab to switch to its dedicated live workspace. Experience instant, 100% private in-browser execution with zero lag.
          </p>
        </div>

        {/* Tab Switcher Bar */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8">
          {toolsList.map((tool) => {
            const isSelected = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTab(tool.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shadow-sm border ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-100"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300"
                }`}
              >
                <span className={isSelected ? "text-white" : tool.color}>
                  {tool.icon}
                </span>
                <span>{tool.name}</span>
              </button>
            );
          })}
        </div>

        {/* Dedicated Section Workspace Container */}
        <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6 sm:p-10 shadow-sm">
          {/* 1. WORD COUNTER DEDICATED SECTION */}
          {activeTab === "word-counter" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Word Counter & Text Analyzer</h3>
                    <p className="text-xs text-slate-500">Live character, word, sentence, and reading time counter.</p>
                  </div>
                </div>

                <Link
                  href="/tools/word-counter"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm self-start sm:self-auto"
                >
                  <span>Open Full Screen Page</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                  <div className="text-2xl font-black text-indigo-600">{words}</div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Words</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                  <div className="text-2xl font-black text-slate-800">{chars}</div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Characters</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                  <div className="text-2xl font-black text-slate-800">{charsNoSpaces}</div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">No Spaces</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                  <div className="text-2xl font-black text-slate-800">{sentences}</div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Sentences</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm col-span-2 sm:col-span-1">
                  <div className="text-2xl font-black text-emerald-600">~{readTimeSec}s</div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Read Time</div>
                </div>
              </div>

              {/* Live Input Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Type or Paste Text Below (Calculates in Real-Time):
                </label>
                <textarea
                  value={wordText}
                  onChange={(e) => setWordText(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm leading-relaxed"
                  placeholder="Type anything here to test real-time counting..."
                />
              </div>
            </div>
          )}

          {/* 2. JSON FORMATTER DEDICATED SECTION */}
          {activeTab === "json-formatter" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Code2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">JSON Formatter & Validator</h3>
                    <p className="text-xs text-slate-500">Beautify, validate, and minify JSON payloads in your browser.</p>
                  </div>
                </div>

                <Link
                  href="/tools/json-formatter"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm self-start sm:self-auto"
                >
                  <span>Open Full Screen Page</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-700">Raw JSON Input:</label>
                    <div className="flex gap-2">
                      <button
                        onClick={formatJson}
                        className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm"
                      >
                        Format (Prettify)
                      </button>
                      <button
                        onClick={minifyJson}
                        className="rounded-lg bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                      >
                        Minify
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    rows={6}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-700">Formatted Output:</label>
                    {jsonStatus === "valid" && (
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        Valid JSON ✓
                      </span>
                    )}
                    {jsonStatus === "invalid" && (
                      <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        Invalid Syntax ✕
                      </span>
                    )}
                  </div>
                  <div className="w-full rounded-2xl border border-slate-200 bg-slate-900 p-3 font-mono text-xs text-emerald-400 overflow-x-auto min-h-[140px] max-h-[160px]">
                    {jsonOutput || "// Click 'Format' to see formatted JSON output here"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. PERCENTAGE CALCULATOR DEDICATED SECTION */}
          {activeTab === "percentage-calculator" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Percent className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Percentage Calculator</h3>
                    <p className="text-xs text-slate-500">Calculate percentage values, increases, and ratios instantly.</p>
                  </div>
                </div>

                <Link
                  href="/tools/percentage-calculator"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm self-start sm:self-auto"
                >
                  <span>Open Full Screen Page</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-bold text-slate-900 mb-4">
                  What is <span className="text-indigo-600">X%</span> of <span className="text-indigo-600">Y</span>?
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span>What is</span>
                  <input
                    type="number"
                    value={pctVal1}
                    onChange={(e) => setPctVal1(Number(e.target.value))}
                    className="w-24 rounded-xl border border-slate-300 p-2 text-center font-bold focus:border-indigo-500 focus:outline-none"
                  />
                  <span>% of</span>
                  <input
                    type="number"
                    value={pctVal2}
                    onChange={(e) => setPctVal2(Number(e.target.value))}
                    className="w-28 rounded-xl border border-slate-300 p-2 text-center font-bold focus:border-indigo-500 focus:outline-none"
                  />
                  <span>=</span>
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 font-black text-emerald-700 text-lg">
                    {((pctVal1 * pctVal2) / 100).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. TEXT CASE CONVERTER DEDICATED SECTION */}
          {activeTab === "text-case-converter" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <Type className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Text Case Converter</h3>
                    <p className="text-xs text-slate-500">Transform text to uppercase, lowercase, title case, camelCase, and more.</p>
                  </div>
                </div>

                <Link
                  href="/tools/text-case-converter"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm self-start sm:self-auto"
                >
                  <span>Open Full Screen Page</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div>
                <textarea
                  value={caseText}
                  onChange={(e) => setCaseText(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm"
                  placeholder="Enter text to convert..."
                />

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setCaseText(caseText.toUpperCase())}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 shadow-sm"
                  >
                    UPPERCASE
                  </button>
                  <button
                    onClick={() => setCaseText(caseText.toLowerCase())}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 shadow-sm"
                  >
                    lowercase
                  </button>
                  <button
                    onClick={() =>
                      setCaseText(
                        caseText.replace(
                          /\w\S*/g,
                          (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
                        )
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 shadow-sm"
                  >
                    Title Case
                  </button>
                  <button
                    onClick={() =>
                      setCaseText(
                        caseText
                          .toLowerCase()
                          .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
                            index === 0 ? word.toLowerCase() : word.toUpperCase()
                          )
                          .replace(/\s+/g, "")
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 shadow-sm"
                  >
                    camelCase
                  </button>
                  <button
                    onClick={() => copyToClipboard(caseText)}
                    className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm ml-auto flex items-center gap-1.5"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Copied" : "Copy Result"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. PASSWORD GENERATOR DEDICATED SECTION */}
          {activeTab === "password-generator" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Cryptographic Password Generator</h3>
                    <p className="text-xs text-slate-500">Hardware-level CSPRNG entropy generated safely in your browser.</p>
                  </div>
                </div>

                <Link
                  href="/tools/password-generator"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm self-start sm:self-auto"
                >
                  <span>Open Full Screen Page</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Password Result Card */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <span className="font-mono text-base sm:text-lg font-bold text-slate-900 break-all">
                  {generatedPass}
                </span>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button
                    onClick={generateNewPassword}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100"
                    title="Generate New"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(generatedPass)}
                    className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
                    <span>Length:</span>
                    <span className="font-mono text-indigo-600 font-bold">{passLength} characters</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={40}
                    value={passLength}
                    onChange={(e) => setPassLength(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <input
                    type="checkbox"
                    id="nums"
                    checked={includeNumbers}
                    onChange={(e) => setIncludeNumbers(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="nums" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Include Numbers (0-9)
                  </label>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <input
                    type="checkbox"
                    id="syms"
                    checked={includeSymbols}
                    onChange={(e) => setIncludeSymbols(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="syms" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Include Symbols (!@#$)
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
