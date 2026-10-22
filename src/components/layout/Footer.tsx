import * as React from "react";
import Link from "next/link";
import { CATEGORIES, TOOLS } from "@/lib/tools-registry";
import { CATEGORY_ORDER, POPULAR_TOOL_IDS } from "@/lib/category-style";
import { CATEGORY_LANDING_PAGES } from "@/lib/category-landing";

export function Footer() {
  const popular = POPULAR_TOOL_IDS.slice(0, 6).map((id) => TOOLS.find((t) => t.id === id)!).filter(Boolean);
  const categories = CATEGORY_ORDER.map((id) => CATEGORIES.find((c) => c.id === id)!).filter(Boolean);

  return (
    <footer className="relative mt-24 overflow-hidden bg-ink text-slate-300">
      {/* 1. Top Glowing Accent Beam */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sun/60 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent blur-sm" />

      {/* 2. Ambient Warm Sun Radial Glow */}
      <div
        className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 h-[340px] w-[700px] rounded-full bg-gradient-to-b from-sun/15 via-sun/5 to-transparent blur-[90px]"
        aria-hidden="true"
      />

      {/* 3. High-Tech Engineering Grid Background Pattern */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_65%_at_50%_0%,#000_50%,transparent_100%)] opacity-85"
        aria-hidden="true"
      />

      {/* 4. Subtle Ambient Side Halos */}
      <div
        className="pointer-events-none absolute -bottom-32 -left-32 h-[300px] w-[300px] rounded-full bg-indigo-500/10 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-[300px] w-[300px] rounded-full bg-sun/10 blur-[100px]"
        aria-hidden="true"
      />

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto max-w-[1240px] px-4 pb-12 pt-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 group" aria-label="Utilby home">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 p-1.5 backdrop-blur-md border border-white/10 transition-transform group-hover:scale-105">
                <svg
                  viewBox="0 0 64 64"
                  className="h-full w-full"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M15 14 V34 C15 43.4 22.6 51 32 51 C41.4 51 49 43.4 49 34 V14"
                    stroke="#FFFFFF"
                    strokeWidth="11"
                    strokeLinecap="round"
                  />
                  <circle cx="32" cy="34" r="10" fill="#FFC53D" />
                </svg>
              </div>
              <span className="font-display text-[22px] font-extrabold tracking-tight text-white">utilby</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              The friendly toolbox for everyday files. Free, instant, and private — everything runs in your browser with zero server uploads.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                100% Client-Side Privacy
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Toolboxes</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {categories.map((c) => {
                const landing = CATEGORY_LANDING_PAGES[c.id as keyof typeof CATEGORY_LANDING_PAGES];
                const href = landing ? `/${landing.slug}` : `/#${c.id}`;
                return (
                  <li key={c.id}>
                    <Link href={href} className="text-slate-400 transition-colors hover:text-white">
                      {c.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Popular Tools</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {popular.map((t) => (
                <li key={t.id}>
                  <Link href={`/tools/${t.slug}`} className="text-slate-400 transition-colors hover:text-white">
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Company & Legal</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/about" className="text-slate-400 transition-colors hover:text-white">About Utilby</Link></li>
              <li><Link href="/contact" className="text-slate-400 transition-colors hover:text-white">Contact & Support</Link></li>
              <li><Link href="/privacy-policy" className="text-slate-400 transition-colors hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="text-slate-400 transition-colors hover:text-white">Terms of Service</Link></li>
              <li><Link href="/disclaimer" className="text-slate-400 transition-colors hover:text-white">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Utilby Network. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Fast & Free</span>
            <span>•</span>
            <span>No Account Needed</span>
            <span>•</span>
            <span>Zero Tracking</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
