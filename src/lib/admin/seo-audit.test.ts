import { describe, it, expect } from "vitest";
import { parsePage, runChecks, findClaimedToolCounts, wrongToolCounts, parseSitemap, checkTitle, scoreChecks } from "./seo-audit";
import { buildChangeRequest, changedFields } from "./change-request";

const HTML = `<!doctype html><html><head><title>Word Counter – Count Words Online | Utilby</title>
<meta name="description" content="Accurately count words, characters, sentences and reading time in real time with a free client-side text analyzer that never uploads text."/>
<meta name="robots" content="index, follow"/><link rel="canonical" href="https://utilby.com/tools/word-counter"/>
<meta property="og:image" content="https://utilby.com/og/tools/word-counter.png"/>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"Word Counter"}</script>
<script type="application/ld+json">{"@type":"FAQPage","mainEntity":[{},{},{}]}</script>
</head><body><header>nav</header><main><h1>Word Counter</h1><p>${"word ".repeat(320)}</p></main></body></html>`;

describe("owner dashboard SEO audit", () => {
  it("parses the parts Google reads", () => {
    const p = parsePage(HTML);
    expect(p.title).toBe("Word Counter – Count Words Online | Utilby");
    expect(p.canonical).toBe("https://utilby.com/tools/word-counter");
    expect(p.faqCount).toBe(3);
    expect(p.schemaTypes).toContain("WebApplication");
    expect(p.h1).toEqual(["Word Counter"]);
    expect(p.wordCount).toBeGreaterThanOrEqual(320);
  });

  it("passes a healthy tool page", () => {
    const checks = runChecks(parsePage(HTML), { path: "/tools/word-counter", kind: "tool", status: 200 });
    expect(checks.filter((c) => c.status !== "pass").map((c) => c.id)).toEqual([]);
    expect(scoreChecks(checks)).toBe(100);
  });

  it("flags a duplicated brand suffix and long titles", () => {
    expect(checkTitle("Merge PDF – Combine PDF Files Online Free | Utilby | Utilby").status).toBe("fail");
    expect(checkTitle("A very long title that keeps going well past the sixty character mark | Utilby").status).toBe("warn");
  });

  it("finds stale tool counts in copy", () => {
    const claims = findClaimedToolCounts("Seven fast, private utilities to merge. 7 Free Tools Available. 9 tools here.");
    expect(claims.map((c) => c.value)).toEqual([7, 7, 9]);
    const checks = runChecks(parsePage(HTML.replace("word word", "Seven fast utilities word")), {
      path: "/pdf-tools",
      kind: "category",
      status: 200,
      toolCounts: { total: 18, own: 9, byCategory: [{ words: ["pdf"], count: 9 }, { words: ["image"], count: 2 }] },
    });
    expect(checks.find((c) => c.id === "counts")?.status).toBe("fail");
  });

  it("accepts correct per-category and total counts", () => {
    const counts = { total: 18, own: 2, byCategory: [{ words: ["pdf"], count: 9 }, { words: ["image"], count: 2 }] };
    expect(wrongToolCounts("9 PDF Tools. 2 Image Tools. 18 free client-side tools. 2 Free Tools Available.", counts)).toEqual([]);
    expect(wrongToolCounts("Over 15 free client-side tools. 7 PDF Tools.", counts).map((c) => c.value)).toEqual([15, 7]);
  });

  it("reports unreachable pages", () => {
    const checks = runChecks(null, { path: "/x", kind: "info", status: 404 });
    expect(checks[0]!.status).toBe("fail");
  });

  it("reads sitemap paths", () => {
    expect(parseSitemap("<url><loc>https://utilby.com</loc></url><url><loc>https://utilby.com/tools/split-pdf</loc></url>")).toEqual(["/", "/tools/split-pdf"]);
  });
});

describe("owner dashboard change requests", () => {
  const base = { name: "Word Counter", shortDescription: "a", longDescription: "b", keywords: "x, y", metaTitle: "T", metaDescription: "D" };
  it("lists only real changes", () => {
    expect(changedFields(base, { ...base, keywords: "x,  y" })).toEqual([]);
    const edited = { ...base, metaTitle: "New title | Utilby" };
    expect(changedFields(base, edited)).toEqual(["metaTitle"]);
    const req = buildChangeRequest({ name: "Word Counter", slug: "word-counter" }, base, edited);
    expect(req).toContain("src/app/tools/word-counter/page.tsx");
    expect(req).toContain("আগে: T");
    expect(req).toContain("এখন: New title | Utilby");
  });
  it("returns nothing when unchanged", () => {
    expect(buildChangeRequest({ name: "W", slug: "w" }, base, base)).toBe("");
  });
});
