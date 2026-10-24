"use client";

import * as React from "react";
import {
  generateSecureRandomPassword,
  generateMultiplePasswords,
  calculatePasswordEntropy,
  generatePassphrase,
  DEFAULT_PASSWORD_OPTIONS,
  PasswordOptions,
} from "./engine";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/shared/CopyButton";
import { RefreshCw, ShieldCheck, KeyRound, BookOpen, Copy, AlertTriangle } from "lucide-react";

export function PasswordGeneratorTool() {
  const [mode, setMode] = React.useState<"random" | "passphrase">("random");
  const [options, setOptions] = React.useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS);
  const [password, setPassword] = React.useState<string>("");
  const [poolSize, setPoolSize] = React.useState<number>(62);
  const [multiCount, setMultiCount] = React.useState<number>(1);
  const [multiPasswords, setMultiPasswords] = React.useState<string[]>([]);
  const [generationError, setGenerationError] = React.useState("");

  // Passphrase options
  const [passphraseWords, setPassphraseWords] = React.useState<number>(4);
  const [passphraseCapitalize, setPassphraseCapitalize] = React.useState<boolean>(true);
  const [passphraseIncludeNumber, setPassphraseIncludeNumber] = React.useState<boolean>(true);

  // Generate password initially and whenever options change
  const refreshPassword = React.useCallback(() => {
    try {
      if (mode === "random") {
        const res = generateSecureRandomPassword(options);
        setPassword(res.password);
        setPoolSize(res.poolSize);
        if (multiCount > 1) setMultiPasswords(generateMultiplePasswords(multiCount, options));
      } else {
        const p = generatePassphrase(passphraseWords, "-", passphraseCapitalize, passphraseIncludeNumber);
        setPassword(p);
        setPoolSize(90);
        if (multiCount > 1) {
          setMultiPasswords(
            Array.from({ length: multiCount }, () =>
              generatePassphrase(passphraseWords, "-", passphraseCapitalize, passphraseIncludeNumber)
            )
          );
        }
      }
      setGenerationError("");
    } catch (error) {
      setPassword("");
      setMultiPasswords([]);
      setGenerationError(error instanceof Error ? error.message : "Secure password generation failed. Please try again.");
    }
  }, [mode, options, multiCount, passphraseWords, passphraseCapitalize, passphraseIncludeNumber]);

  React.useEffect(() => {
    refreshPassword();
  }, [refreshPassword]);

  const entropyData = React.useMemo(() => {
    return calculatePasswordEntropy(password, poolSize);
  }, [password, poolSize]);

  const handleCopyAll = () => {
    if (multiPasswords.length > 0) {
      navigator.clipboard.writeText(multiPasswords.join("\n"));
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setMode("random")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
            mode === "random"
              ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>Random Password</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("passphrase")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
            mode === "passphrase"
              ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Memorable Passphrase</span>
        </button>
      </div>

      {/* Primary Display Box */}
      {generationError && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{generationError}</span>
        </div>
      )}
      <div className="relative rounded-2xl border border-slate-700 bg-slate-900 p-4 sm:p-6 text-white shadow-inner dark:border-slate-800">
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
            <span>CSPRNG Secure • Evaluated locally in browser</span>
          </div>
        </div>
      </div>

      {/* Configuration Controls */}
      {mode === "random" ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Length Slider */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-white">
                  Password Length
                </label>
                <span className="rounded-lg bg-ink/5 px-3 py-1 font-mono text-sm font-bold text-ink dark:bg-white/10 dark:text-white">
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
                className="w-full accent-ink cursor-pointer h-2 bg-slate-200 rounded-lg dark:bg-slate-800"
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
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      multiCount === num
                        ? "bg-ink text-white dark:bg-white dark:text-ink"
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
                className="h-4 w-4 rounded accent-ink"
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
                className="h-4 w-4 rounded accent-ink"
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
                className="h-4 w-4 rounded accent-ink"
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
                className="h-4 w-4 rounded accent-ink"
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
                className="h-4 w-4 rounded accent-ink"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Exclude Confusing Characters (l, 1, I, O, 0)
              </span>
            </label>
          </div>
        </div>
      ) : (
        /* Memorable Passphrase Options */
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-white">
                  Word Count
                </label>
                <span className="rounded-lg bg-ink/5 px-3 py-1 font-mono text-sm font-bold text-ink dark:bg-white/10 dark:text-white">
                  {passphraseWords} words
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="7"
                value={passphraseWords}
                onChange={(e) => setPassphraseWords(Number(e.target.value))}
                className="w-full accent-ink cursor-pointer h-2 bg-slate-200 rounded-lg dark:bg-slate-800"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>3 words (Easy)</span>
                <span>4 words (Recommended)</span>
                <span>7 words (Fortress)</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Batch Quantity
              </label>
              <div className="flex items-center gap-2">
                {[1, 3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMultiCount(num)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      multiCount === num
                        ? "bg-ink text-white dark:bg-white dark:text-ink"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {num === 1 ? "Single" : `${num} Passphrases`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl bg-slate-50 p-4.5 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Passphrase Style
            </span>

            <label className="flex items-center gap-3 text-sm text-slate-800 dark:text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={passphraseCapitalize}
                onChange={(e) => setPassphraseCapitalize(e.target.checked)}
                className="h-4 w-4 rounded accent-ink"
              />
              <span>Capitalize First Letters (e.g. Galaxy-Amber)</span>
            </label>

            <label className="flex items-center gap-3 text-sm text-slate-800 dark:text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={passphraseIncludeNumber}
                onChange={(e) => setPassphraseIncludeNumber(e.target.checked)}
                className="h-4 w-4 rounded accent-ink"
              />
              <span>Append Random Number (e.g. -42)</span>
            </label>
          </div>
        </div>
      )}

      {/* Multiple Passwords Display (if multiCount > 1) */}
      {multiCount > 1 && multiPasswords.length > 0 && (
        <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Batch Generated ({multiCount})
            </h4>
            <Button type="button" size="sm" variant="outline" onClick={handleCopyAll}>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy All ({multiCount})</span>
            </Button>
          </div>
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
