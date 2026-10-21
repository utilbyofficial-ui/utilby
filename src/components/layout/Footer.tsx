import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Heart, Wrench, Lock } from "lucide-react";
import { CATEGORIES } from "@/lib/tools-registry";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Trust & Privacy Banner */}
      <div className="border-b border-slate-100 bg-slate-50/60 py-6 dark:border-slate-800/60 dark:bg-slate-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">100% Client-Side Privacy</h4>
                <p className="text-xs text-slate-500">Your text, files, and passwords never leave your browser.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">No Installation Required</h4>
                <p className="text-xs text-slate-500">Fast, free, zero-bloat browser utilities accessible worldwide.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">AdSense Policy Compliant</h4>
                <p className="text-xs text-slate-500">Clean, user-first layouts without aggressive or deceptive ads.</p>
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
                <Wrench className="h-4 w-4" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Util<span className="text-indigo-600 dark:text-indigo-400">by</span>
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-500">
              An international free online utility tools network designed to simplify everyday digital workflows for developers, writers, students, and professionals worldwide.
            </p>
            <p className="mt-4 text-[11px] text-slate-400 flex items-center gap-2">
              <span>© {new Date().getFullYear()} Utilby Network. All rights reserved.</span>
              <span>•</span>
              <Link href="/admin" className="text-slate-400 hover:text-indigo-600 transition-colors">
                Admin Portal
              </Link>
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Tool Categories
            </h3>
            <ul className="mt-4 space-y-2 text-xs">
              {CATEGORIES.slice(0, 4).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/#${cat.id}`}
                    className="text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Upcoming Tools
            </h3>
            <ul className="mt-4 space-y-2 text-xs">
              {CATEGORIES.slice(4).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/#${cat.id}`}
                    className="text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/tools/password-generator"
                  className="text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white"
                >
                  Password Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policy (Mandatory for AdSense) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Legal & Trust
            </h3>
            <ul className="mt-4 space-y-2 text-xs">
              <li>
                <Link href="/about" className="text-slate-600 hover:text-indigo-600 dark:text-slate-400">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-600 hover:text-indigo-600 dark:text-slate-400">
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-slate-600 hover:text-indigo-600 dark:text-slate-400">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-slate-600 hover:text-indigo-600 dark:text-slate-400">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-slate-600 hover:text-indigo-600 dark:text-slate-400">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
