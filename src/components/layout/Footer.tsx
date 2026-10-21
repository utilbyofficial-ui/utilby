import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Heart, Wrench, Lock, Zap, ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "@/lib/tools-registry";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#07090E] text-slate-400">
      {/* Trust & Performance Banner */}
      <div className="border-b border-white/[0.06] bg-[#090D15]/60 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex items-center gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">100% Client-Side Privacy</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Your files & text never leave your local browser RAM.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Sub-Millisecond Engine</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">V8 native algorithms execute instantly with 0ms server lag.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Permanent Free Access</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Zero subscriptions, paywalls, or accounts ever required.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20">
                <Wrench className="h-4 w-4" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                Util<span className="text-indigo-400">by</span>
              </span>
            </Link>

            <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-400">
              International high-performance online utility network engineered to simplify digital workflows for developers, writers, students, and professionals with total client-side privacy.
            </p>

            {/* System Status Pill */}
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-mono text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All 5 Core Engines Active &amp; Fast</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300">Tool Categories</h4>
            <ul className="mt-3 space-y-2 text-xs">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/#${cat.id}`}
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Foundation Tools */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300">Popular Tools</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/tools/word-counter" className="text-slate-400 transition-colors hover:text-white">
                  Word Counter
                </Link>
              </li>
              <li>
                <Link href="/tools/json-formatter" className="text-slate-400 transition-colors hover:text-white">
                  JSON Formatter
                </Link>
              </li>
              <li>
                <Link href="/tools/percentage-calculator" className="text-slate-400 transition-colors hover:text-white">
                  Percentage Calculator
                </Link>
              </li>
              <li>
                <Link href="/tools/text-case-converter" className="text-slate-400 transition-colors hover:text-white">
                  Text Case Converter
                </Link>
              </li>
              <li>
                <Link href="/tools/password-generator" className="text-slate-400 transition-colors hover:text-white">
                  Password Generator
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Trust */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300">Legal &amp; Trust</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/privacy-policy" className="text-slate-400 transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-slate-400 transition-colors hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-slate-400 transition-colors hover:text-white">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-400 transition-colors hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-400 transition-colors hover:text-white">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-white/[0.06] pt-8 text-xs sm:flex-row text-slate-500">
          <p>© {new Date().getFullYear()} Utilby Network. All rights reserved.</p>
          <div className="mt-4 flex items-center gap-6 sm:mt-0 font-mono text-[11px]">
            <span>100% Client-Side Architecture</span>
            <span>•</span>
            <span>Zero-Server Footprint</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
