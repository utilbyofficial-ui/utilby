"use client";

import * as React from "react";
import {
  calculatePercentageOf,
  calculateWhatPercentageIs,
  calculatePercentageChange,
  calculateDiscount,
} from "./engine";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/shared/CopyButton";
import { ClearButton } from "@/components/shared/ClearButton";
import { Percent, ArrowUpRight, ArrowDownRight, Tag, HelpCircle, ArrowLeftRight, RotateCcw } from "lucide-react";

export function PercentageCalculatorTool() {
  const [activeTab, setActiveTab] = React.useState<"of" | "what" | "change" | "discount">("of");

  // State for Calculator 1: What is X% of Y?
  const [c1X, setC1X] = React.useState<string>("15");
  const [c1Y, setC1Y] = React.useState<string>("240");
  const c1Result = React.useMemo(() => {
    return calculatePercentageOf(parseFloat(c1X), parseFloat(c1Y));
  }, [c1X, c1Y]);

  // State for Calculator 2: X is what % of Y?
  const [c2X, setC2X] = React.useState<string>("45");
  const [c2Y, setC2Y] = React.useState<string>("180");
  const c2Result = React.useMemo(() => {
    return calculateWhatPercentageIs(parseFloat(c2X), parseFloat(c2Y));
  }, [c2X, c2Y]);

  // State for Calculator 3: % Increase / Decrease from X to Y
  const [c3X, setC3X] = React.useState<string>("120");
  const [c3Y, setC3Y] = React.useState<string>("150");
  const c3Result = React.useMemo(() => {
    return calculatePercentageChange(parseFloat(c3X), parseFloat(c3Y));
  }, [c3X, c3Y]);

  // State for Calculator 4: Discount & Final Price
  const [c4Price, setC4Price] = React.useState<string>("89.99");
  const [c4Discount, setC4Discount] = React.useState<string>("25");
  const c4Result = React.useMemo(() => {
    return calculateDiscount(parseFloat(c4Price), parseFloat(c4Discount));
  }, [c4Price, c4Discount]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Selector Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("of")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "of"
              ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <Percent className="h-4 w-4" />
          <span>What is X% of Y?</span>
        </button>

        <button
          onClick={() => setActiveTab("what")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "what"
              ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span>X is What % of Y?</span>
        </button>

        <button
          onClick={() => setActiveTab("change")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "change"
              ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <ArrowUpRight className="h-4 w-4" />
          <span>Percentage Change</span>
        </button>

        <button
          onClick={() => setActiveTab("discount")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "discount"
              ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <Tag className="h-4 w-4" />
          <span>Discount & Savings</span>
        </button>
      </div>

      {/* Calculator Body */}
      <div className="mt-6">
        {/* Module 1: What is X% of Y? */}
        {activeTab === "of" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-3">
              <Input
                label="Percentage (%)"
                type="number"
                step="any"
                value={c1X}
                onChange={(e) => setC1X(e.target.value)}
                placeholder="e.g. 15"
              />
              <button
                type="button"
                onClick={() => {
                  const temp = c1X;
                  setC1X(c1Y);
                  setC1Y(temp);
                }}
                className="mb-1 hidden sm:flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                title="Swap values"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
              <Input
                label="Of Number"
                type="number"
                step="any"
                value={c1Y}
                onChange={(e) => setC1Y(e.target.value)}
                placeholder="e.g. 240"
              />
            </div>

            {/* Quick Percentage Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Presets:</span>
              {[5, 10, 15, 20, 25, 50].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setC1X(p.toString())}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    c1X === p.toString()
                      ? "bg-ink text-white dark:bg-white dark:text-ink"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>

            <div className="rounded-xl bg-slate-50 p-6 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              {"error" in c1Result ? (
                <div className="text-sm font-semibold text-rose-600">{c1Result.error}</div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Calculated Result</span>
                      <div className="text-3xl font-black text-ink dark:text-white mt-1">{c1Result.result.toLocaleString()}</div>
                    </div>
                    <CopyButton textToCopy={c1Result.result.toString()} />
                  </div>
                  {c1Result.formula && <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs font-mono text-slate-500">Formula: {c1Result.formula}</div>}
                </>
              )}
            </div>
          </div>
        )}

        {/* Module 2: X is what % of Y? */}
        {activeTab === "what" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-3">
              <Input
                label="Value (X)"
                type="number"
                step="any"
                value={c2X}
                onChange={(e) => setC2X(e.target.value)}
                placeholder="e.g. 45"
              />
              <button
                type="button"
                onClick={() => {
                  const temp = c2X;
                  setC2X(c2Y);
                  setC2Y(temp);
                }}
                className="mb-1 hidden sm:flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                title="Swap values"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
              <Input
                label="Total (Y)"
                type="number"
                step="any"
                value={c2Y}
                onChange={(e) => setC2Y(e.target.value)}
                placeholder="e.g. 180"
              />
            </div>

            <div className="rounded-xl bg-slate-50 p-6 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              {"error" in c2Result ? (
                <div className="text-sm font-semibold text-rose-600">{c2Result.error}</div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Percentage Proportion
                      </span>
                      <div className="text-3xl font-black text-ink dark:text-white mt-1">
                        {c2Result.result}%
                      </div>
                    </div>
                    <CopyButton textToCopy={`${c2Result.result}%`} />
                  </div>
                  {c2Result.formula && (
                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs font-mono text-slate-500">
                      Formula: {c2Result.formula}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Module 3: % Increase or Decrease */}
        {activeTab === "change" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-3">
              <Input
                label="Initial / Starting Value"
                type="number"
                step="any"
                value={c3X}
                onChange={(e) => setC3X(e.target.value)}
                placeholder="e.g. 120"
              />
              <button
                type="button"
                onClick={() => {
                  const temp = c3X;
                  setC3X(c3Y);
                  setC3Y(temp);
                }}
                className="mb-1 hidden sm:flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                title="Swap values"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
              <Input
                label="Final / New Value"
                type="number"
                step="any"
                value={c3Y}
                onChange={(e) => setC3Y(e.target.value)}
                placeholder="e.g. 150"
              />
            </div>

            <div className="rounded-xl bg-slate-50 p-6 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              {"error" in c3Result ? (
                <div className="text-sm font-semibold text-rose-600">{c3Result.error}</div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Percentage Difference
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-3xl font-black ${
                            c3Result.type === "increase"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : c3Result.type === "decrease"
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-slate-700"
                          }`}
                        >
                          {c3Result.percentChange}%
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${
                            c3Result.type === "increase"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : c3Result.type === "decrease"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {c3Result.type}
                        </span>
                      </div>
                    </div>
                    <CopyButton textToCopy={`${c3Result.percentChange}% ${c3Result.type}`} />
                  </div>
                  {c3Result.formula && (
                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs font-mono text-slate-500">
                      Formula: {c3Result.formula} (Difference: {c3Result.difference})
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Module 4: Discount & Savings */}
        {activeTab === "discount" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Original Price ($)"
                type="number"
                step="any"
                value={c4Price}
                onChange={(e) => setC4Price(e.target.value)}
                placeholder="e.g. 89.99"
              />
              <Input
                label="Discount (%)"
                type="number"
                step="any"
                value={c4Discount}
                onChange={(e) => setC4Discount(e.target.value)}
                placeholder="e.g. 25"
              />
            </div>

            {/* Quick Discount Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Discount Presets:</span>
              {[10, 15, 20, 25, 30, 50, 70].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setC4Discount(d.toString())}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    c4Discount === d.toString()
                      ? "bg-ink text-white dark:bg-white dark:text-ink"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {d}% OFF
                </button>
              ))}
            </div>

            <div className="rounded-xl bg-slate-50 p-6 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              {"error" in c4Result ? (
                <div className="text-sm font-semibold text-rose-600">{c4Result.error}</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Final Discounted Price</span>
                      <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">${c4Result.finalPrice}</div>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">You Save</span>
                      <div className="text-3xl font-black text-ink dark:text-white mt-1">${c4Result.discountAmount}</div>
                    </div>
                  </div>
                  {c4Result.savingsFormula && <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs font-mono text-slate-500">{c4Result.savingsFormula}</div>}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
