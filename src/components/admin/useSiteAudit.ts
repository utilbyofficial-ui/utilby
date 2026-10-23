"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-registry";
import { CATEGORY_LANDING_PAGES } from "@/lib/category-landing";
import {
  parsePage,
  parseSitemap,
  runChecks,
  scoreChecks,
  type PageAudit,
  type PageKind,
  type ParsedPage,
  type ToolCounts,
} from "@/lib/admin/seo-audit";

const CATEGORY_BY_SLUG = new Map(Object.values(CATEGORY_LANDING_PAGES).map((c) => [`/${c.slug}`, c.id]));

const CATEGORY_WORDS: Record<string, string[]> = {
  pdf: ["pdf"],
  image: ["image", "images"],
  text: ["text"],
  developer: ["developer", "dev"],
  security: ["security"],
  calculators: ["calculator", "calculators"],
};

const TOOL_COUNTS: ToolCounts = {
  total: TOOLS.filter((t) => t.isReady).length,
  byCategory: Object.entries(CATEGORY_WORDS).map(([id, words]) => ({
    words,
    count: TOOLS.filter((t) => t.category === id && t.isReady).length,
  })),
};

export function pageKind(path: string): PageKind {
  if (path === "/") return "home";
  if (path === "/tools") return "directory";
  if (path.startsWith("/tools/")) return "tool";
  if (CATEGORY_BY_SLUG.has(path)) return "category";
  return "info";
}

/** Fetches a page from this same site. Falls back to `.html` for plain static servers. */
export async function fetchPage(path: string): Promise<{ status: number; html: string }> {
  try {
    // Cloudflare Pages serves `/tools` from `tools.html`; plain local servers need the extension.
    const local = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
    const url = local && path !== "/" && !/\.\w+$/.test(path) ? `${path}.html` : path;
    const res = await fetch(url, { cache: "no-store" });
    return { status: res.status, html: res.ok ? await res.text() : "" };
  } catch {
    return { status: 0, html: "" };
  }
}

async function auditPath(path: string): Promise<PageAudit> {
  const kind = pageKind(path);
  const { status, html } = await fetchPage(path);
  const parsed: ParsedPage | null = html ? parsePage(html) : null;
  const categoryId = CATEGORY_BY_SLUG.get(path);
  const toolCounts =
    kind === "info" || kind === "tool"
      ? undefined
      : { ...TOOL_COUNTS, own: categoryId ? TOOLS.filter((t) => t.category === categoryId && t.isReady).length : undefined };
  const checks = runChecks(parsed, { path, kind, status, toolCounts });
  return { path, kind, status, parsed, checks, score: scoreChecks(checks) };
}

export interface SiteAuditState {
  running: boolean;
  progress: { done: number; total: number };
  pages: PageAudit[];
  /** Ready tools whose page is missing from sitemap.xml. */
  missingFromSitemap: string[];
  error: string;
  finishedAt: Date | null;
}

const INITIAL: SiteAuditState = {
  running: false,
  progress: { done: 0, total: 0 },
  pages: [],
  missingFromSitemap: [],
  error: "",
  finishedAt: null,
};

export function useSiteAudit() {
  const [state, setState] = React.useState<SiteAuditState>(INITIAL);
  const runningRef = React.useRef(false);

  const run = React.useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setState((s) => ({ ...s, running: true, error: "", progress: { done: 0, total: 0 } }));
    try {
      const sm = await fetchPage("/sitemap.xml");
      if (!sm.html) throw new Error("sitemap.xml পড়া যায়নি।");
      const paths = [...new Set(parseSitemap(sm.html))];
      const inSitemap = new Set(paths);
      const missingFromSitemap = TOOLS.filter((t) => t.isReady && !inSitemap.has(`/tools/${t.slug}`)).map((t) => t.name);

      setState((s) => ({ ...s, progress: { done: 0, total: paths.length } }));
      const results: PageAudit[] = new Array(paths.length);
      let next = 0;
      let done = 0;
      const worker = async () => {
        while (next < paths.length) {
          const i = next++;
          results[i] = await auditPath(paths[i]!);
          done++;
          setState((s) => ({ ...s, progress: { done, total: paths.length } }));
        }
      };
      await Promise.all(Array.from({ length: 4 }, worker));
      setState({
        running: false,
        progress: { done, total: paths.length },
        pages: results,
        missingFromSitemap,
        error: "",
        finishedAt: new Date(),
      });
    } catch (e) {
      setState((s) => ({ ...s, running: false, error: e instanceof Error ? e.message : "চেক করা যায়নি।" }));
    } finally {
      runningRef.current = false;
    }
  }, []);

  return { ...state, run };
}

export type AccessStatus = "checking" | "protected" | "open" | "unknown";

/**
 * Detects whether /admin is behind Cloudflare Access: a request without cookies is redirected to
 * the Access login page when the lock is on, and answered normally when it is off.
 */
export function useAccessStatus(): AccessStatus {
  const [status, setStatus] = React.useState<AccessStatus>("checking");
  React.useEffect(() => {
    let alive = true;
    fetch(window.location.pathname, { credentials: "omit", redirect: "manual", cache: "no-store" })
      .then((res) => {
        if (!alive) return;
        if (res.type === "opaqueredirect" || res.status === 302 || res.status === 403) setStatus("protected");
        else if (res.ok) setStatus("open");
        else setStatus("unknown");
      })
      .catch(() => alive && setStatus("unknown"));
    return () => {
      alive = false;
    };
  }, []);
  return status;
}

/** localStorage helpers that never throw (private mode, blocked storage…). */
export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — keep working in memory */
  }
}

export function useLocalState<T>(key: string, fallback: T): [T, (v: T) => void] {
  const [value, setValue] = React.useState<T>(fallback);
  React.useEffect(() => {
    setValue(readLocal(key, fallback));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = React.useCallback(
    (v: T) => {
      setValue(v);
      writeLocal(key, v);
    },
    [key]
  );
  return [value, set];
}
