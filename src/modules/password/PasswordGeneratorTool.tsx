"use client";

import * as React from "react";
import {
  generateSecureRandomPassword,
  generateMultiplePasswords,
  calculatePasswordEntropy,
  DEFAULT_PASSWORD_OPTIONS,
  PasswordOptions,
} from "./engine";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/shared/CopyButton";
import { RefreshCw, ShieldCheck, Copy, Check, Sparkles } from "lucide-react";

export function PasswordGeneratorTool() {
  const [options, setOptions] = React.useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS);
  const [password, setPassword] = React.useState<string>("");
  const [poolSize, setPoolSize] = React.useState<number>(62);
  const [multiCount, setMultiCount] = React.useState<number>(1);
  const [multiPasswords, setMultiPasswords] = React.useState<string[]>([]);

  // Generate password initially and whenever options change
  const refreshPassword = React.useCallback(() => {
    const res = generateSecureRandomPassword(options);
    setPassword(res.password);
    setPoolSize(res.poolSize);

    if (multiCount > 1) {
      setMultiPasswords(generateMultiplePasswords(multiCount, options));
    }
  }, [options, multiCount]);

  React.useEffect(() => {
    refreshPassword();
  }, [refreshPassword]);

  const entropyData = React.useMemo(() => {
    return calculatePasswordEntropy(password, poolSize);
  }, [password, poolSize]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Primary Display Box */}
      <div className="relative rounded-2xl border border-indigo-100 bg-slate-900 p-4 sm:p-6 text-white shadow-inner dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 overflow-x-auto py-2">
            <span className="font-mono text-xl sm:text-2xl md:text-3xl font-bold tracking-wider text-emerald-400 break-all select-all">
              {password}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={refreshPassword}
              title="Generate new password"
              className="bg-slate-800 text-white hover:bg-slate-700 border-slate-700"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Regenerate</span>
            </Button>
            <CopyButton textToCopy={password} label="Copy Password" />
          </div>
        </div>

        {/* Strength & Entropy Meter */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Strength:</span>
            <span className={`font-bold ${entropyData.colorClass}`}>
              {entropyData.strength}
            </span>
            <span className="text-slate-500">
              ({entropyData.entropy} bits entropy)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>CSPRNG Secure • Evaluated locally</span>
          </div>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Length Slider */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-900 dark:text-white">
                Password Length
              </label>
              <span className="rounded-lg bg-indigo-50 px-3 py-1 font-mono text-sm font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {options.length} characters
              </span>
            </div>
            <input
              type="range"
              min="6"
              max="64"
              value={options.length}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, length: Number(e.target.value) }))
              }
              className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg dark:bg-slate-800"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>6 (Minimum)</span>
              <span>16 (Recommended)</span>
              <span>64 (Ultra-secure)</span>
            </div>
          </div>

          {/* Multiple Passwords Batch Selector */}
          <div className="pt-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Batch Quantity (Generate multiple at once)
            </label>
            <div className="flex items-center gap-2">
              {[1, 3, 5, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setMultiCount(num);
                    if (num > 1) {
                      setMultiPasswords(generateMultiplePasswords(num, options));
                    }
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    multiCount === num
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {num === 1 ? "Single" : `${num} Passwords`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Character Pool Checkboxes */}
        <div className="space-y-3 rounded-xl bg-slate-50 p-4.5 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Character Rules
          </span>

          <label className="flex items-center gap-3 text-sm text-slate-800 dark:text-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.includeUppercase}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, includeUppercase: e.target.checked }))
              }
              className="h-4 w-4 rounded accent-indigo-600"
            />
            <span>Include Uppercase Letters (A-Z)</span>
          </label>

          <label className="flex items-center gap-3 text-sm text-slate-800 dark:text-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.includeLowercase}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, includeLowercase: e.target.checked }))
              }
              className="h-4 w-4 rounded accent-indigo-600"
            />
            <span>Include Lowercase Letters (a-z)</span>
          </label>

          <label className="flex items-center gap-3 text-sm text-slate-800 dark:text-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.includeNumbers}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, includeNumbers: e.target.checked }))
              }
              className="h-4 w-4 rounded accent-indigo-600"
            />
            <span>Include Numbers (0-9)</span>
          </label>

          <label className="flex items-center gap-3 text-sm text-slate-800 dark:text-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.includeSymbols}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, includeSymbols: e.target.checked }))
              }
              className="h-4 w-4 rounded accent-indigo-600"
            />
            <span>Include Special Symbols (!@#$%^&*)</span>
          </label>

          <label className="flex items-center gap-3 text-sm text-slate-800 dark:text-slate-200 cursor-pointer select-none pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <input
              type="checkbox"
              checked={options.excludeAmbiguous}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, excludeAmbiguous: e.target.checked }))
              }
              className="h-4 w-4 rounded accent-indigo-600"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Exclude Confusing Characters (l, 1, I, O, 0)
            </span>
          </label>
        </div>
      </div>

      {/* Multiple Passwords Display (if multiCount > 1) */}
      {multiCount > 1 && multiPasswords.length > 0 && (
        <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Batch Generated Passwords ({multiCount})
          </h4>
          <div className="space-y-2">
            {multiPasswords.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 px-3 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
              >
                <span className="font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 select-all truncate pr-2">
                  {p}
                </span>
                <CopyButton textToCopy={p} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
