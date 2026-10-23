/**
 * SEO / AdSense health checks for the owner dashboard (/admin).
 *
 * Everything here is pure: it takes the HTML of a published page (fetched from the same site in
 * the owner's browser) and returns a list of checks. No data ever leaves the browser.
 */

export const SITE_ORIGIN = "https://utilby.com";

export type CheckStatus = "pass" | "warn" | "fail";

export interface SeoCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface ParsedPage {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  robots: string;
  h1: string[];
  faqCount: number;
  schemaTypes: string[];
  wordCount: number;
  visibleText: string;
}

export type PageKind = "home" | "directory" | "category" | "tool" | "info";

export interface PageAudit {
  path: string;
  kind: PageKind;
  status: number;
  parsed: ParsedPage | null;
  checks: SeoCheck[];
  score: number;
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#x27;": "'",
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#x27|#39);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function attr(tag: string, name: string): string {
  const m = tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"));
  return m ? decodeEntities(m[1]!) : "";
}

function findMeta(html: string, key: "name" | "property", value: string): string {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const t of tags) if (attr(t, key).toLowerCase() === value) return attr(t, "content");
  return "";
}

function stripTags(html: string): string {
  return decodeEntities(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      // Block boundaries become a separator so text from neighbouring boxes never merges into one phrase.
      .replace(/<\/(p|div|li|ul|ol|h[1-6]|button|td|th|section|header|footer|nav|label)>/gi, " ¦ ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

/** Extracts the SEO-relevant parts of a rendered page. */
export function parsePage(html: string): ParsedPage {
  const title = decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "");
  const canonicalTag = (html.match(/<link\b[^>]*>/gi) ?? []).find((t) => attr(t, "rel") === "canonical");
  const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => stripTags(m[1]!));

  const schemaTypes: string[] = [];
  let faqCount = 0;
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]!);
      const items: unknown[] = Array.isArray(data) ? data : Array.isArray(data?.["@graph"]) ? data["@graph"] : [data];
      for (const it of items as Record<string, unknown>[]) {
        const type = String(it?.["@type"] ?? "");
        if (type) schemaTypes.push(type);
        if (type === "FAQPage" && Array.isArray(it.mainEntity)) faqCount += it.mainEntity.length;
      }
    } catch {
      /* ignore malformed JSON-LD — reported via missing schema */
    }
  }

  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;
  const visibleText = stripTags(main);
  const wordCount = visibleText ? visibleText.split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;

  return {
    title,
    description: findMeta(html, "name", "description"),
    canonical: canonicalTag ? attr(canonicalTag, "href") : "",
    ogImage: findMeta(html, "property", "og:image"),
    robots: findMeta(html, "name", "robots"),
    h1,
    faqCount,
    schemaTypes,
    wordCount,
    visibleText,
  };
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20,
};

/** Finds phrases like "7 Free Tools" or "Seven fast, private utilities" and returns the numbers claimed. */
export function findClaimedToolCounts(text: string): { phrase: string; value: number; words: string }[] {
  const re = /\b(\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b((?:\s+[\w,'-]+){0,3}?)\s+(tools|utilities)\b/gi;
  const out: { phrase: string; value: number; words: string }[] = [];
  for (const m of text.matchAll(re)) {
    const raw = m[1]!.toLowerCase();
    const value = /^\d+$/.test(raw) ? Number(raw) : NUMBER_WORDS[raw]!;
    out.push({ phrase: m[0], value, words: (m[2] ?? "").toLowerCase() });
  }
  return out;
}

export interface ToolCounts {
  /** All ready tools on the site. */
  total: number;
  /** Ready tools per category, keyed by the words people use for it ("pdf", "image"…). */
  byCategory: { words: string[]; count: number }[];
  /** Ready tools of the category this page is about (category pages only). */
  own?: number;
}

/** Claimed counts that don't match the real number of tools. */
export function wrongToolCounts(text: string, counts: ToolCounts) {
  return findClaimedToolCounts(text).filter((c) => {
    const cat = counts.byCategory.find((b) => b.words.some((w) => new RegExp(`\\b${w}\\b`).test(c.words)));
    if (cat) return c.value !== cat.count;
    return c.value !== counts.total && c.value !== counts.own;
  });
}

export interface CheckContext {
  path: string;
  kind: PageKind;
  status: number;
  /** Real tool numbers, used to catch stale counts written in the copy. */
  toolCounts?: ToolCounts;
}

const pass = (id: string, label: string, detail: string): SeoCheck => ({ id, label, status: "pass", detail });
const warn = (id: string, label: string, detail: string): SeoCheck => ({ id, label, status: "warn", detail });
const fail = (id: string, label: string, detail: string): SeoCheck => ({ id, label, status: "fail", detail });

export function checkTitle(title: string): SeoCheck {
  const L = "টাইটেল";
  if (!title) return fail("title", L, "টাইটেল নেই।");
  const brand = (title.match(/utilby/gi) ?? []).length;
  if (brand > 1) return fail("title", L, `"Utilby" ${brand} বার আছে — একবার রাখুন।`);
  const n = [...title].length;
  if (n > 60) return warn("title", L, `${n} অক্ষর — ৬০-এর বেশি হলে Google-এ কেটে যেতে পারে।`);
  if (n < 25) return warn("title", L, `${n} অক্ষর — একটু ছোট, মূল কিওয়ার্ড যোগ করুন।`);
  return pass("title", L, `${n} অক্ষর — ঠিক আছে।`);
}

export function checkDescription(description: string): SeoCheck {
  const L = "মেটা ডেসক্রিপশন";
  if (!description) return fail("description", L, "ডেসক্রিপশন নেই।");
  const n = [...description].length;
  if (n > 160) return warn("description", L, `${n} অক্ষর — ১৬০-এর বেশি হলে কেটে যায়।`);
  if (n < 120) return warn("description", L, `${n} অক্ষর — ১২০–১৬০ হলে ভালো।`);
  return pass("description", L, `${n} অক্ষর — ঠিক আছে।`);
}

export function runChecks(parsed: ParsedPage | null, ctx: CheckContext): SeoCheck[] {
  if (!parsed || ctx.status !== 200) {
    return [fail("status", "পেজ লোড", `পেজ খোলা যায়নি (HTTP ${ctx.status || "error"})।`)];
  }
  const checks: SeoCheck[] = [pass("status", "পেজ লোড", "পেজ ঠিকমতো খুলছে।")];
  checks.push(checkTitle(parsed.title));
  checks.push(checkDescription(parsed.description));

  const expectedCanonical = SITE_ORIGIN + (ctx.path === "/" ? "" : ctx.path);
  const canon = parsed.canonical.replace(/\/$/, "");
  checks.push(
    !parsed.canonical
      ? fail("canonical", "Canonical লিংক", "Canonical নেই।")
      : canon === expectedCanonical.replace(/\/$/, "") || ctx.kind === "category"
        ? pass("canonical", "Canonical লিংক", parsed.canonical)
        : warn("canonical", "Canonical লিংক", `অন্য পেজ দেখাচ্ছে: ${parsed.canonical}`)
  );

  checks.push(
    /noindex/i.test(parsed.robots)
      ? fail("robots", "Google-এ দেখা যাবে", "পেজে noindex আছে — Google দেখাবে না।")
      : pass("robots", "Google-এ দেখা যাবে", "ইনডেক্স হতে পারবে।")
  );

  checks.push(
    parsed.ogImage
      ? pass("og", "শেয়ার ছবি (OG)", "Facebook/WhatsApp-এ শেয়ার করলে ছবি দেখাবে।")
      : warn("og", "শেয়ার ছবি (OG)", "og:image নেই — শেয়ার করলে ছবি আসবে না।")
  );

  checks.push(
    parsed.h1.length === 1
      ? pass("h1", "একটি H1 শিরোনাম", parsed.h1[0]!)
      : warn("h1", "একটি H1 শিরোনাম", parsed.h1.length === 0 ? "H1 নেই।" : `${parsed.h1.length}টি H1 আছে — একটি রাখুন।`)
  );

  const minWords = ctx.kind === "info" ? 150 : 300;
  checks.push(
    parsed.wordCount >= minWords
      ? pass("words", "কনটেন্টের পরিমাণ", `${parsed.wordCount} শব্দ।`)
      : warn("words", "কনটেন্টের পরিমাণ", `${parsed.wordCount} শব্দ — AdSense-এর জন্য অন্তত ${minWords} শব্দ রাখা ভালো।`)
  );

  if (ctx.kind === "tool") {
    checks.push(
      parsed.faqCount >= 3
        ? pass("faq", "FAQ (Google রিচ রেজাল্ট)", `${parsed.faqCount}টি প্রশ্ন।`)
        : warn("faq", "FAQ (Google রিচ রেজাল্ট)", `${parsed.faqCount}টি প্রশ্ন — অন্তত ৩টি দিন।`)
    );
    checks.push(
      parsed.schemaTypes.includes("WebApplication")
        ? pass("schema", "টুল স্কিমা", "WebApplication স্কিমা আছে।")
        : warn("schema", "টুল স্কিমা", "WebApplication স্কিমা নেই।")
    );
  }

  if (ctx.toolCounts) {
    const wrong = wrongToolCounts(parsed.visibleText, ctx.toolCounts);
    checks.push(
      wrong.length
        ? fail(
            "counts",
            "টুলের সংখ্যা সঠিক",
            `লেখায় পুরনো সংখ্যা: ${[...new Set(wrong.map((w) => `"${w.phrase}"`))].join(", ")} — সাইটে এখন ${ctx.toolCounts.total}টি টুল${ctx.toolCounts.own !== undefined ? `, এই ক্যাটাগরিতে ${ctx.toolCounts.own}টি` : ""}।`
          )
        : pass("counts", "টুলের সংখ্যা সঠিক", "লেখার সংখ্যাগুলো আসল টুলের সাথে মিলে।")
    );
  }

  return checks;
}

export function scoreChecks(checks: SeoCheck[]): number {
  if (!checks.length) return 0;
  const pts = checks.reduce((s, c) => s + (c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0), 0);
  return Math.round((pts / checks.length) * 100);
}

/** Paths listed in a sitemap.xml, relative to the site root. */
export function parseSitemap(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => {
    try {
      const u = new URL(m[1]!);
      return u.pathname.replace(/\/$/, "") || "/";
    } catch {
      return m[1]!;
    }
  });
}
