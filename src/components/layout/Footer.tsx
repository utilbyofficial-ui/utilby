import * as React from "react";
import Link from "next/link";
import { CATEGORIES, TOOLS } from "@/lib/tools-registry";
import { CATEGORY_ORDER, POPULAR_TOOL_IDS } from "@/lib/category-style";
import { CATEGORY_LANDING_PAGES } from "@/lib/category-landing";

export function Footer() {
  const popular = POPULAR_TOOL_IDS.slice(0, 6).map((id) => TOOLS.find((t) => t.id === id)!).filter(Boolean);
  const categories = CATEGORY_ORDER.map((id) => CATEGORIES.find((c) => c.id === id)!).filter(Boolean);
  return (
    <footer className="mt-24 bg-ink text-slate-300">
      <div className="mx-auto max-w-[1240px] px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5" aria-label="Utilby home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/concept-2-3d-isometric-icon.png"
                alt="Utilby"
                className="h-9 w-9 rounded-xl shadow-xs object-cover"
              />
              <span className="font-display text-[22px] font-extrabold tracking-tight text-white">utilby</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              The friendly toolbox for everyday files. Free, instant, and private — everything runs in your browser.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">Toolboxes</h2>
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
            <h2 className="text-sm font-semibold text-white">Popular</h2>
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
            <h2 className="text-sm font-semibold text-white">Utilby</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/about" className="text-slate-400 transition-colors hover:text-white">About</Link></li>
              <li><Link href="/contact" className="text-slate-400 transition-colors hover:text-white">Contact</Link></li>
              <li><Link href="/privacy-policy" className="text-slate-400 transition-colors hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="text-slate-400 transition-colors hover:text-white">Terms of Service</Link></li>
              <li><Link href="/disclaimer" className="text-slate-400 transition-colors hover:text-white">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Utilby. All rights reserved.</p>
          <p>Free tools · No sign-up · No uploads</p>
        </div>
      </div>
    </footer>
  );
}
