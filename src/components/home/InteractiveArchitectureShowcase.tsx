"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  FileText,
  Code2,
  KeyRound,
  ImageIcon,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

interface PipelineMode {
  id: string;
  name: string;
  category: string;
  toolSlug: string;
  toolName: string;
  badge: string;
  inputTitle: string;
  defaultInput: string;
  engineSpecs: {
    technology: string;
    throughput: string;
    privacy: string;
  };
  outputSummary: {
    primary: string;
    details: string[];
    statusText: string;
  };
}

const PIPELINE_MODES: PipelineMode[] = [
  {
    id: "text",
    name: "Text & Analytics",
    category: "V8 Engine / Regex",
    toolSlug: "word-counter",
    toolName: "Word Counter & Analyzer",
    badge: "01 // TEXT PIPELINE",
    inputTitle: "Raw User Input (Browser RAM)",
    defaultInput: "Fast, privacy-first utility tools engineered for international productivity.",
    engineSpecs: {
      technology: "Client-side Regex Tokenizer",
      throughput: "140,000 words/sec",
      privacy: "0 bytes transmitted to cloud",
    },
    outputSummary: {
      primary: "10 Words • 76 Characters",
      details: ["Read time: ~3 sec", "Sentences: 1", "Paragraphs: 1"],
      statusText: "Computed in 0.14ms",
    },
  },
  {
    id: "json",
    name: "Data AST Parser",
    category: "RFC 8259 Engine",
    toolSlug: "json-formatter",
    toolName: "JSON Formatter & Validator",
    badge: "02 // DATA STRUCTURES",
    inputTitle: "Unformatted Minified Payload",
    defaultInput: '{"status":"ok","engine":"utilby","clientSide":true,"latencyMs":0.2}',
    engineSpecs: {
      technology: "Native JSON AST Lexer",
      throughput: "Instant validation",
      privacy: "Client isolated sandboxing",
    },
    outputSummary: {
      primary: "Valid JSON Object (RFC 8259)",
      details: ["4 Key-value pairs", "Indent: 2 Spaces", "AST depth: 1 level"],
      statusText: "Syntax Verified ✓",
    },
  },
  {
    id: "crypto",
    name: "CSPRNG Cryptography",
    category: "window.crypto API",
    toolSlug: "password-generator",
    toolName: "Cryptographic Password Generator",
    badge: "03 // HARDWARE ENTROPY",
    inputTitle: "Hardware Entropy Seed",
    defaultInput: "Config: 20 Chars • Numbers • Symbols • Uppercase",
    engineSpecs: {
      technology: "OS-level Cryptographic PRNG",
      throughput: "High-entropy random values",
      privacy: "Generated in memory only",
    },
    outputSummary: {
      primary: "k9#Mv$82!pQx&49Lm@z1",
      details: ["Entropy: 128 bits", "Crack time: Centuries", "Strength: Maximum"],
      statusText: "Cryptographically Secure",
    },
  },
  {
    id: "image",
    name: "High-Perf Media",
    category: "Canvas & Web Worker",
    toolSlug: "word-counter",
    toolName: "Browser Image Compressor",
    badge: "04 // BROWSER CANVAS",
    inputTitle: "High-Resolution Image File",
    defaultInput: "camera_raw_asset.png (4.8 MB, 3840x2160)",
    engineSpecs: {
      technology: "HTML5 Canvas Offscreen Worker",
      throughput: "Multi-threaded Web Worker",
      privacy: "Files never leave your device",
    },
    outputSummary: {
      primary: "optimized_asset.webp (420 KB)",
      details: ["91.2% Size reduction", "Lossless visual quality", "EXIF stripped locally"],
      statusText: "100% Client-Side Render",
    },
  },
];

export function InteractiveArchitectureShowcase() {
  const [activeTab, setActiveTab] = useState<string>("text");
  const [customInput, setCustomInput] = useState<string>(PIPELINE_MODES[0].defaultInput);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const currentMode = PIPELINE_MODES.find((m) => m.id === activeTab) || PIPELINE_MODES[0];

  const handleTabChange = (modeId: string) => {
    setActiveTab(modeId);
    const selected = PIPELINE_MODES.find((m) => m.id === modeId);
    if (selected) {
      setCustomInput(selected.defaultInput);
    }
  };

  const triggerSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 600);
  };

  // Dynamic live calculation for text mode
  const getDynamicOutput = () => {
    if (activeTab === "text") {
      const trimmed = customInput.trim();
      const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
      const chars = customInput.length;
      const readTime = Math.ceil(words / 200 * 60);
      return {
        primary: `${words} Words • ${chars} Characters`,
        details: [
          `Read time: ~${readTime || 1} sec`,
          `Spaces: ${customInput.split(" ").length - 1}`,
          "V8 Regex Parser",
        ],
        statusText: "Live Real-Time Computed",
      };
    }
    return currentMode.outputSummary;
  };

  const dynamicOutput = getDynamicOutput();

  return (
    <section className="relative overflow-hidden bg-[#07090E] py-20 text-slate-100 border-y border-slate-800">
      {/* Background Dot Matrix (Railway Style) */}
      <div 
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#6366f1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Ambient Lighting Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-400 mb-4 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Interactive Architecture Engine</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            How Utilby Works:{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Zero Latency, 100% In-Browser
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Unlike traditional utility websites that upload your confidential files to remote servers, Utilby runs micro-engines directly inside your browser’s V8 environment. Zero cloud roundtrips, zero storage leaks.
          </p>
        </div>

        {/* The Railway-Style Interactive Canvas & Control Deck */}
        <div className="rounded-2xl border border-slate-800 bg-[#0B0F19]/90 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Top Terminal Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-[#080B12]/80">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                <span>utilby-engine // client-pipeline.wasm</span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono mt-2 sm:mt-0">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>ENGINE ACTIVE</span>
              </div>
              <div className="text-slate-500 hidden sm:block">|</div>
              <div className="flex items-center gap-1 text-slate-300 hidden sm:flex">
                <Lock className="h-3 w-3 text-emerald-400" />
                <span>CLOUD UPLOAD: 0 BYTES</span>
              </div>
              <div className="text-slate-500 hidden sm:block">|</div>
              <div className="flex items-center gap-1 text-indigo-300">
                <Zap className="h-3 w-3 text-amber-400" />
                <span>LATENCY: &lt; 0.2ms</span>
              </div>
            </div>
          </div>

          {/* Interactive Workspace Body: Left Rail + Pipeline Visualizer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
            {/* Left Rail (Railway Style Indicator Track) */}
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800/80 p-5 bg-[#080B13]/60 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-slate-500 mb-4 flex items-center justify-between">
                  <span>Select Execution Pipeline</span>
                  <span className="text-indigo-400">Interactive</span>
                </div>

                <div className="relative pl-6 space-y-3">
                  {/* Vertical Rail Line with sliding indicator */}
                  <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-800">
                    <div
                      className="absolute w-2 h-2 rounded-full bg-indigo-500 -left-[3px] shadow-[0_0_8px_#6366f1] transition-all duration-300"
                      style={{
                        top:
                          activeTab === "text"
                            ? "8%"
                            : activeTab === "json"
                            ? "33%"
                            : activeTab === "crypto"
                            ? "58%"
                            : "83%",
                      }}
                    />
                  </div>

                  {PIPELINE_MODES.map((mode) => {
                    const isSelected = activeTab === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => handleTabChange(mode.id)}
                        className={`w-full text-left rounded-xl p-3.5 transition-all text-xs border ${
                          isSelected
                            ? "bg-indigo-950/40 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10"
                            : "bg-slate-900/40 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-indigo-400 font-semibold">
                            {mode.badge}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                              Connected
                            </span>
                          )}
                        </div>
                        <div className="mt-1 font-bold text-sm text-slate-200">{mode.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{mode.category}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Engine Spec Card at Bottom of Rail */}
              <div className="mt-6 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 text-[11px]">
                <div className="font-mono text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Sub-System Architecture</span>
                </div>
                <div className="space-y-1.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>Engine:</span>
                    <span className="font-mono text-slate-200">{currentMode.engineSpecs.technology}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Throughput:</span>
                    <span className="font-mono text-emerald-400">{currentMode.engineSpecs.throughput}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security:</span>
                    <span className="font-mono text-indigo-300">{currentMode.engineSpecs.privacy}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: The Animated Dynamic Flow Architecture Canvas */}
            <div className="lg:col-span-8 p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0B0F19] via-[#090D16] to-[#070A10]">
              {/* Animated SVG Connector Background Wires */}
              <div className="hidden md:block absolute inset-0 pointer-events-none">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  {/* Left Wire: Input to Engine */}
                  <path
                    d="M 220 180 C 310 180, 310 180, 390 180"
                    stroke="#4338ca"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="6 6"
                    className="animate-dash-flow opacity-70"
                  />
                  {/* Right Wire: Engine to Output */}
                  <path
                    d="M 470 180 C 540 180, 540 180, 610 180"
                    stroke="#6366f1"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="6 6"
                    className="animate-dash-flow opacity-70"
                  />
                </svg>
              </div>

              {/* Three-Tier Pipeline Visual Nodes */}
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {/* Node 1: User Client Input */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-700/60 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        Stage 1 // Client RAM
                      </span>
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-xs font-bold text-white mb-2">{currentMode.inputTitle}</div>

                    {activeTab === "text" ? (
                      <textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none resize-none font-mono"
                        placeholder="Type something here to see instant client calculation..."
                      />
                    ) : (
                      <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-slate-300 break-all select-all">
                        {currentMode.defaultInput}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Input Buffer</span>
                    <span className="text-emerald-400">Sandboxed ✓</span>
                  </div>
                </div>

                {/* Node 2: Core In-Browser Compute Engine */}
                <div
                  className={`flex flex-col justify-between rounded-xl border bg-gradient-to-b from-indigo-950/60 to-slate-900/90 p-4 shadow-xl backdrop-blur-md transition-all ${
                    isSimulating
                      ? "border-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.4)] scale-105"
                      : "border-indigo-500/40 shadow-indigo-500/10"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-wider">
                        Stage 2 // Core Engine
                      </span>
                      <Cpu className="h-3.5 w-3.5 text-indigo-400 animate-spin" style={{ animationDuration: "10s" }} />
                    </div>
                    <div className="text-xs font-bold text-white mb-2">Local V8 Micro-Kernel</div>

                    <div className="space-y-2 rounded-lg bg-slate-950/80 p-2.5 border border-indigo-950 text-[11px] font-mono text-slate-300">
                      <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                        <Layers className="h-3 w-3" />
                        <span>{currentMode.toolName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ⚡ WebAssembly / V8 Native
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Isolated RAM Execution</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-indigo-900/50 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">Roundtrip:</span>
                    <span className="text-emerald-400 font-bold">0.00ms</span>
                  </div>
                </div>

                {/* Node 3: Instant Local Output */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-700/60 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        Stage 3 // Output
                      </span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div className="text-xs font-bold text-white mb-2">Processed In Real-Time</div>

                    <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 font-mono text-xs">
                      <div className="font-bold text-indigo-300">{dynamicOutput.primary}</div>
                      <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-400">
                        {dynamicOutput.details.map((detail, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="text-indigo-500">•</span>
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Status</span>
                    <span className="text-emerald-400 font-semibold">{dynamicOutput.statusText}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Interactive Action & Launch Tool Bar */}
              <div className="mt-8 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={triggerSimulation}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSimulating ? "animate-spin" : ""}`} />
                    <span>Trigger Micro-Cycle</span>
                  </button>
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    Simulating 60fps client frame dispatch
                  </span>
                </div>

                <Link
                  href={`/tools/${currentMode.toolSlug}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all hover:translate-x-0.5"
                >
                  <span>Launch {currentMode.name} Full Tool</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Triple Feature Cards Below Visualizer (Railway Inspired Highlights) */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group rounded-2xl border border-slate-800/80 bg-[#0B0F19]/60 p-6 transition-all hover:border-indigo-500/50 hover:bg-[#0B0F19]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4 group-hover:scale-110 transition-transform">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Confidential By Architecture</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              We literally cannot see, store, or sell your passwords, confidential code, or personal documents. The processing code runs exclusively on your CPU.
            </p>
          </div>

          <div className="group rounded-2xl border border-slate-800/80 bg-[#0B0F19]/60 p-6 transition-all hover:border-violet-500/50 hover:bg-[#0B0F19]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-4 group-hover:scale-110 transition-transform">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Zero Server Lag</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              No uploading gigabytes to a slow cloud queue. Every tool executes with sub-millisecond responsiveness powered by modern Web APIs and V8 JIT.
            </p>
          </div>

          <div className="group rounded-2xl border border-slate-800/80 bg-[#0B0F19]/60 p-6 transition-all hover:border-emerald-500/50 hover:bg-[#0B0F19]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Permanently 100% Free</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Because client-side computation costs us nothing in heavy server compute bills, Utilby will never enforce annoying paywalls, limits, or account subscriptions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
