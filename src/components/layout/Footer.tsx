import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Heart, Wrench, Lock, Zap, ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "@/lib/tools-registry";

export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white text-slate-600">
      {/* Trust & Performance Banner */}
      <div className="border-b border-slate-100 bg-slate-50/70 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">100% Client-Side Privacy</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Your files &amp; text never leave your local browser RAM.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Instant In-Browser Speed</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Algorithms execute directly on your device with 0ms server lag.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Free Forever</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Zero paywalls, limits, or subscriptions ever required.</p>
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
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold shadow-md shadow-indigo-500/20">
                <Wrench className="h-4 w-4" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                Util<span className="text-indigo-600">by</span>
              </span>
            </Link>

            <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-500">
              An international free online utility network engineered to simplify digital workflows with complete client-side confidentiality.
            </p>

            {/* System Status Pill */}
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>All 5 Core Utilities Active &amp; Fast</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Categories</h4>
            <ul className="mt-3 space-y-2 text-xs">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/#${cat.id}`}
                    className="text-slate-500 transition-colors hover:text-indigo-600"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Foundation Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Popular Tools</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/tools/word-counter" className="text-slate-500 transition-colors hover:text-indigo-600">
                  Word Counter
                </Link>
              </li>
              <li>
                <Link href="/tools/json-formatter" className="text-slate-500 transition-colors hover:text-indigo-600">
                  JSON Formatter
                </Link>
              </li>
              <li>
                <Link href="/tools/percentage-calculator" className="text-slate-500 transition-colors hover:text-indigo-600">
                  Percentage Calculator
                </Link>
              </li>
              <li>
                <Link href="/tools/text-case-converter" className="text-slate-500 transition-colors hover:text-indigo-600">
                  Text Case Converter
                </Link>
              </li>
              <li>
                <Link href="/tools/password-generator" className="text-slate-500 transition-colors hover:text-indigo-600">
                  Password Generator
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Legal &amp; Trust</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/privacy-policy" className="text-slate-500 transition-colors hover:text-indigo-600">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-slate-500 transition-colors hover:text-indigo-600">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-slate-500 transition-colors hover:text-indigo-600">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-500 transition-colors hover:text-indigo-600">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-500 transition-colors hover:text-indigo-600">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-slate-200/80 pt-6 text-xs sm:flex-row text-slate-500">
          <p>© {new Date().getFullYear()} Utilby Network. All rights reserved.</p>
          <div className="mt-3 sm:mt-0 flex items-center gap-4 text-xs font-medium">
            <span>100% Client-Side Architecture</span>
            <span>•</span>
            <span>Zero Server Footprint</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
