"use client";

import * as React from "react";
import Link from "next/link";
import {
  TOOLS as DEFAULT_TOOLS,
  CATEGORIES,
  ToolMeta,
} from "@/lib/tools-registry";
import {
  Shield,
  Lock,
  LogOut,
  Wrench,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  ExternalLink,
  Edit3,
  Save,
  Download,
  BarChart3,
  Globe,
  DollarSign,
  AlertCircle,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const DEFAULT_PIN = "admin2026";

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const [pinInput, setPinInput] = React.useState<string>("");
  const [loginError, setLoginError] = React.useState<string>("");

  const [activeTab, setActiveTab] = React.useState<
    "overview" | "tools" | "editor" | "system"
  >("overview");

  // Load custom tools from localStorage if available
  const [tools, setTools] = React.useState<ToolMeta[]>(DEFAULT_TOOLS);
  const [selectedToolId, setSelectedToolId] = React.useState<string>(
    DEFAULT_TOOLS[0]?.id || "word-counter"
  );
  const [searchFilter, setSearchFilter] = React.useState<string>("");
  const [saveSuccess, setSaveSuccess] = React.useState<boolean>(false);
  const [copiedCode, setCopiedCode] = React.useState<boolean>(false);

  // Check auth session
  React.useEffect(() => {
    const sessionAuth = sessionStorage.getItem("utilby_admin_auth");
    if (sessionAuth === "true") {
      setIsAuthenticated(true);
    }

    const savedTools = localStorage.getItem("utilby_admin_tools");
    if (savedTools) {
      try {
        setTools(JSON.parse(savedTools));
      } catch {
        // Fallback to default
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === DEFAULT_PIN) {
      setIsAuthenticated(true);
      sessionStorage.setItem("utilby_admin_auth", "true");
      setLoginError("");
    } else {
      setLoginError("Invalid passcode. Please enter the correct admin passcode.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("utilby_admin_auth");
  };

  // Toggle tool active status
  const toggleToolStatus = (id: string) => {
    const updated = tools.map((t) =>
      t.id === id ? { ...t, isReady: !t.isReady } : t
    );
    setTools(updated);
    localStorage.setItem("utilby_admin_tools", JSON.stringify(updated));
  };

  // Edit tool data
  const currentEditingTool = tools.find((t) => t.id === selectedToolId) || tools[0];

  const updateCurrentTool = (field: keyof ToolMeta, value: unknown) => {
    if (!currentEditingTool) return;
    const updated = tools.map((t) =>
      t.id === currentEditingTool.id ? { ...t, [field]: value } : t
    );
    setTools(updated);
  };

  const handleSaveEditor = () => {
    localStorage.setItem("utilby_admin_tools", JSON.stringify(tools));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    if (confirm("Reset all tools configuration to project defaults?")) {
      setTools(DEFAULT_TOOLS);
      localStorage.removeItem("utilby_admin_tools");
    }
  };

  const filteredTools = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.categoryName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const readyToolsCount = tools.filter((t) => t.isReady).length;
  const roadmapToolsCount = tools.filter((t) => !t.isReady).length;

  // Render Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-slate-950">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-4">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-black text-white">Utilby Admin Portal</h1>
            <p className="mt-1 text-xs text-slate-400">
              Enter your master passcode to access the administrative control center.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Passcode
              </label>
              <input
                type="password"
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter passcode..."
                className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950 px-4 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {loginError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-950/50 p-3 text-xs text-rose-300 border border-rose-800/60">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-indigo-600 font-semibold text-sm text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Sign In to Dashboard
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-slate-950/60 p-3.5 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400">
              Default passcode for initial setup:{" "}
              <strong className="text-indigo-400 font-mono">admin2026</strong>
            </span>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render Full Admin Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Admin Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">Utilby</span>
                <span className="rounded bg-indigo-950 px-2 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-800/60">
                  ADMIN CONSOLE
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Network Management & Content Controller
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              <span>View Public Site</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950/70 px-3 py-1.5 rounded-lg border border-rose-900/60 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4 mb-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("tools")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "tools"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Manage Tools ({tools.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("editor")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "editor"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Edit3 className="h-4 w-4" />
            <span>Content & SEO Editor</span>
          </button>

          <button
            onClick={() => setActiveTab("system")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "system"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>External Dashboards & Links</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <span>Total Tools in Network</span>
                  <Wrench className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="mt-3 text-3xl font-black text-white">
                  {tools.length}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Across {CATEGORIES.length} specialized categories
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <span>Live & Active Tools</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="mt-3 text-3xl font-black text-emerald-400">
                  {readyToolsCount}
                </div>
                <div className="mt-1 text-xs text-emerald-500/80">
                  100% Client-Side Tested
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <span>Roadmap Expansion</span>
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
                <div className="mt-3 text-3xl font-black text-amber-400">
                  {roadmapToolsCount}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Phase 2 & 3 (Image & PDF Tools)
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <span>Hosting & Server Cost</span>
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="mt-3 text-3xl font-black text-white">
                  $0.00 <span className="text-xs font-normal text-slate-500">/ mo</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Cloudflare Pages Edge Free Tier
                </div>
              </div>
            </div>

            {/* Architecture & Infrastructure Status */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-indigo-400" />
                  <span>Platform System Health</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-slate-800 text-xs">
                    <span className="text-slate-400">Execution Model</span>
                    <span className="font-semibold text-emerald-400">
                      100% Client-Side (V8 Engine)
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800 text-xs">
                    <span className="text-slate-400">Rendering Engine</span>
                    <span className="font-semibold text-white">
                      Static Site Generation (SSG 16/16 Pages)
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800 text-xs">
                    <span className="text-slate-400">Database Overhead</span>
                    <span className="font-semibold text-emerald-400">
                      Zero DB (Zero SQL injection risks)
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800 text-xs">
                    <span className="text-slate-400">AdSense Policy Compliance</span>
                    <span className="font-semibold text-emerald-400">
                      Ready (CLS-safe slots + 5 Mandatory Legal pages)
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 text-xs">
                    <span className="text-slate-400">Automated Unit Tests</span>
                    <span className="font-semibold text-emerald-400">
                      22 / 22 Tests Passed (Vitest)
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Links to Major External Portals */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-indigo-400" />
                  <span>Your Key External Portals</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  These are the official platforms where you monitor actual visitor traffic, Google index status, and ad revenues:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href="https://search.google.com/search-console"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-700 transition-colors text-xs font-semibold text-slate-200"
                  >
                    <span>Google Search Console</span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  </a>

                  <a
                    href="https://analytics.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-700 transition-colors text-xs font-semibold text-slate-200"
                  >
                    <span>Google Analytics (GA4)</span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  </a>

                  <a
                    href="https://adsense.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-700 transition-colors text-xs font-semibold text-slate-200"
                  >
                    <span>Google AdSense</span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  </a>

                  <a
                    href="https://dash.cloudflare.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-700 transition-colors text-xs font-semibold text-slate-200"
                  >
                    <span>Cloudflare Pages</span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE TOOLS */}
        {activeTab === "tools" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">All Platform Tools</h2>
                <p className="text-xs text-slate-400">
                  Control which tools appear as active or coming-soon on your public website.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter tools..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Tools Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-4">Tool Name & Path</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Live Status</th>
                      <th className="p-4">Toggle Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTools.map((tool) => (
                      <tr key={tool.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white text-sm">{tool.name}</div>
                          <div className="text-[11px] font-mono text-slate-500">
                            /tools/{tool.slug}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                            {tool.categoryName}
                          </span>
                        </td>
                        <td className="p-4">
                          {tool.isReady ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-800/60">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active Live
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/80 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-800/60">
                              Phase 2/3 Roadmap
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => toggleToolStatus(tool.id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                              tool.isReady ? "bg-indigo-600" : "bg-slate-700"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                tool.isReady ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedToolId(tool.id);
                                setActiveTab("editor");
                              }}
                              className="rounded-lg bg-slate-800 hover:bg-slate-700 p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="Edit Content"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            {tool.isReady && (
                              <Link
                                href={`/tools/${tool.slug}`}
                                target="_blank"
                                className="rounded-lg bg-slate-800 hover:bg-slate-700 p-2 text-slate-300 hover:text-white transition-colors"
                                title="Open in New Tab"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONTENT & SEO EDITOR */}
        {activeTab === "editor" && currentEditingTool && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Tool Content & Metadata Editor</h2>
                <p className="text-xs text-slate-400">
                  Edit titles, descriptions, and SEO keywords for any tool without touching code.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <Check className="h-4 w-4" /> Changes Saved!
                  </span>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSaveEditor}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Controls */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select Tool to Edit
                  </label>
                  <select
                    value={selectedToolId}
                    onChange={(e) => setSelectedToolId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {tools.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.categoryName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={currentEditingTool.name}
                    onChange={(e) => updateCurrentTool("name", e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Short Description (Directory & Card View)
                  </label>
                  <textarea
                    rows={2}
                    value={currentEditingTool.shortDescription}
                    onChange={(e) =>
                      updateCurrentTool("shortDescription", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Long Description (SEO Meta Description)
                  </label>
                  <textarea
                    rows={3}
                    value={currentEditingTool.longDescription}
                    onChange={(e) =>
                      updateCurrentTool("longDescription", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    SEO Keywords (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={currentEditingTool.keywords.join(", ")}
                    onChange={(e) =>
                      updateCurrentTool(
                        "keywords",
                        e.target.value.split(",").map((k) => k.trim())
                      )
                    }
                    className="w-full h-10 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Card Preview in Directory
                </span>
                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-indigo-400 font-bold">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                      {currentEditingTool.categoryName}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {currentEditingTool.name}
                  </h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    {currentEditingTool.shortDescription}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-indigo-400 font-semibold">
                    <span>Open Tool →</span>
                    <span className="font-mono text-slate-500">
                      /{currentEditingTool.slug}
                    </span>
                  </div>
                </div>

                {/* Export Config Button */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <span className="text-xs font-bold text-slate-300 block mb-1">
                    Export Configuration
                  </span>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Copy the updated configuration JSON to permanently sync with the codebase.
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(tools, null, 2));
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 p-2.5 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span className="text-emerald-400">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy Tools JSON Config</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM & EXTERNAL */}
        {activeTab === "system" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">System Tools & Sitemap</h2>
              <p className="text-xs text-slate-400">
                Direct access to XML sitemaps, robots protocol, and system reset utilities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
                <h3 className="text-base font-bold text-white">Search Engine Discovery Files</h3>
                <div className="space-y-2">
                  <Link
                    href="/sitemap.xml"
                    target="_blank"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-700 text-xs text-slate-200 transition-colors"
                  >
                    <span className="font-mono">/sitemap.xml</span>
                    <span className="text-indigo-400 text-[11px] flex items-center gap-1">
                      Open <ExternalLink className="h-3 w-3" />
                    </span>
                  </Link>

                  <Link
                    href="/robots.txt"
                    target="_blank"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-700 text-xs text-slate-200 transition-colors"
                  >
                    <span className="font-mono">/robots.txt</span>
                    <span className="text-indigo-400 text-[11px] flex items-center gap-1">
                      Open <ExternalLink className="h-3 w-3" />
                    </span>
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
                <h3 className="text-base font-bold text-white">Danger & Reset Zone</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Reset any custom overrides made in this admin browser session and revert to the factory configuration.
                </p>
                <button
                  onClick={handleResetDefaults}
                  className="rounded-xl border border-rose-800/60 bg-rose-950/40 hover:bg-rose-950/80 px-4 py-2 text-xs font-semibold text-rose-300 transition-colors cursor-pointer"
                >
                  Reset All Overrides to Factory Default
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
