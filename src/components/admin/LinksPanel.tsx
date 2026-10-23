"use client";

import type { AccessStatus } from "./useSiteAudit";
import { ExternalLinkItem, Panel } from "./ui";

const LINKS = [
  { href: "https://search.google.com/search-console", title: "Google Search Console", desc: "কোন কিওয়ার্ডে কত ক্লিক, ইনডেক্সিং সমস্যা" },
  { href: "https://analytics.google.com", title: "Google Analytics", desc: "ভিজিটর ও জনপ্রিয় টুল" },
  { href: "https://adsense.google.com", title: "Google AdSense", desc: "আয়, অনুমোদন ও পলিসি নোটিশ" },
  { href: "https://dash.cloudflare.com", title: "Cloudflare Dashboard", desc: "Pages ডিপ্লয়, DNS, Web Analytics" },
  { href: "https://one.dash.cloudflare.com", title: "Cloudflare Zero Trust", desc: "এই পেজের লক (Access) সেটিংস" },
  { href: "https://github.com/utilbyofficial-ui/utilby", title: "GitHub রিপোজিটরি", desc: "কোড ও কমিট ইতিহাস" },
  { href: "https://pagespeed.web.dev/analysis?url=https%3A%2F%2Futilby.com", title: "PageSpeed Insights", desc: "হোমপেজের স্পিড ও Core Web Vitals" },
  { href: "https://search.google.com/test/rich-results?url=https%3A%2F%2Futilby.com", title: "Rich Results Test", desc: "FAQ/স্কিমা Google ঠিকমতো পড়ছে কিনা" },
];

const ACCESS_STEPS = [
  "one.dash.cloudflare.com খুলুন। প্রথমবার হলে একটা team name দিন আর Free plan বেছে নিন (কার্ডের তথ্য চাইতে পারে, Free plan-এ চার্জ হয় না)।",
  "Access → Applications → Add an application → Self-hosted বেছে নিন।",
  "Application domain-এ utilby.com আর Path-এ admin লিখুন।",
  "Policy বানান: Action = Allow, Include → Emails → আপনার নিজের ইমেইল।",
  "Save করুন। এরপর utilby.com/admin খুললে ইমেইল চাইবে, সেখানে একটা কোড যাবে — কোড দিলেই ঢুকতে পারবেন।",
];

export function LinksPanel({ access }: { access: AccessStatus }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="দরকারি লিংক">
        <div className="grid gap-3">
          {LINKS.map((l) => (
            <ExternalLinkItem key={l.href} {...l} />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <a href="/sitemap.xml" target="_blank" className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-slate-700 hover:bg-slate-200">
            /sitemap.xml
          </a>
          <a href="/robots.txt" target="_blank" className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-slate-700 hover:bg-slate-200">
            /robots.txt
          </a>
        </div>
      </Panel>

      <Panel title="এই পেজ লক করুন (Cloudflare Access)">
        <div
          className={
            access === "protected"
              ? "mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
              : "mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
          }
        >
          {access === "protected" ? "🔒 লক চালু আছে।" : access === "checking" ? "অবস্থা দেখা হচ্ছে…" : "🔓 লক এখনো চালু হয়নি।"}
        </div>
        <p className="mb-4 text-sm text-slate-600">
          সাইটটা পুরোপুরি স্ট্যাটিক, তাই পাসওয়ার্ড কোডে রাখলে সেটা যে কেউ দেখতে পারে। আসল নিরাপত্তা হলো Cloudflare-এর ফ্রি Access — Cloudflare নিজে পাহারা দেয়, শুধু আপনার ইমেইলে কোড গেলে তবেই পেজ খোলে।
        </p>
        <ol className="space-y-3">
          {ACCESS_STEPS.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm text-ink">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">{i + 1}</span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-slate-500">মেনুর নাম Cloudflare মাঝে মাঝে বদলায়, তাই একটু আলাদা দেখাতে পারে।</p>
      </Panel>
    </div>
  );
}
