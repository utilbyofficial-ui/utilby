# Utilby — Handoff Notes (2026-10-22)

Read this before changing anything. Live site: https://utilby.com (Cloudflare Pages, auto-deploys `main`).

## Working rules (from the project owner)
1. `git pull origin main` before starting — two AI agents work on this repo.
2. Before pushing: `npm run build` **and** `npm test` must pass.
3. Every tool is 100% client-side. No user data may ever be sent to a server.
4. Design: clean, premium, light theme (see Design system below).

## Stack
Next.js 15 App Router · `output: "export"` (static, `out/`) · TypeScript · Tailwind 3 · Vitest.
Deploy: push to `main` → Cloudflare builds and serves `out/` (`wrangler.json`).

## Project layout
- `src/lib/tools-registry.ts` — **single source of truth** for every tool (name, slug, category, `isReady`, `featured`, keywords). Homepage, header search, footer, sitemap and "related tools" all read from it.
- `src/lib/category-style.ts` — category colors/glyphs, tool glyphs, `CATEGORY_ORDER`, `POPULAR_TOOL_IDS` (homepage "Most loved").
- `src/modules/<tool>/` — `engine.ts` (pure logic) + `engine.test.ts` + `<Tool>Tool.tsx` (UI, `"use client"`).
- `src/app/tools/<slug>/page.tsx` — metadata + `<ToolLayout>` with how-to steps, technical details, FAQs.
- `src/components/shared/ToolLayout.tsx` — shared tool page frame (hero, related tools, FAQ, schema.org).
- `src/lib/ads-config.ts` + `src/components/ads/AdSlot.tsx` — ads render **nothing** until `NEXT_PUBLIC_ADSENSE_CLIENT` and `NEXT_PUBLIC_ADSENSE_SLOT` are set in Cloudflare env vars.

## Adding a new tool (checklist)
1. `src/modules/<tool>/engine.ts` + tests (pure functions only).
2. `src/modules/<tool>/<Name>Tool.tsx` (client component).
3. `src/app/tools/<slug>/page.tsx` with `metadata` (title, description, keywords, canonical, openGraph) and `<ToolLayout>`.
4. Registry entry in `tools-registry.ts` (`isReady: true`); add a glyph in `category-style.ts` `TOOL_GLYPHS`.
5. If the icon name is new, add it to nothing else — homepage uses `ToolGlyph`, not lucide icons.
6. `npm run build && npm test`, then push.

## Live tools (15)
Text: Word Counter, Text Case Converter · Developer: JSON Formatter, QR Code Generator · Calculators: Percentage · Security: Password Generator · Image: Image Compressor, Image Resizer · PDF: Merge, Split, Organize, Rotate, Delete Pages, Extract Pages, JPG to PDF.
Coming soon (registry, `isReady: false`): PDF Editor, PDF Compressor.

## PDF toolkit architecture (`src/modules/pdf/`)
- `pages.ts` — pure page model (move, rotate, delete, duplicate, blank pages, range parsing). Fully tested.
- `build.ts` — builds output PDFs with **pdf-lib** (lossless page copy, image embedding, rotation). Tested in Node.
- `image.ts` — EXIF orientation reader + image preparation for embedding.
- `render.ts` — **PDF.js** thumbnails, lazy-loaded. Worker is served from `public/vendor/pdfjs/pdf.worker-4.10.38.min.js`. **If you upgrade `pdfjs-dist`, copy the new worker file and update `PDFJS_WORKER_SRC`** — versions must match exactly.
- `PdfWorkspace.tsx` — one shared workspace used by all 7 PDF pages via `mode` prop (`merge | split | organize | rotate | delete | extract | images`). Undo/redo, drag-reorder, multi-select, split/extract with ZIP (fflate).
- `seo.tsx` — per-page SEO copy/FAQs for every PDF route; `PdfToolPage.tsx` renders them.
- Password-protected PDFs are not supported yet (clear error is shown).

## Design system — "Playful Color" (chosen by the owner)
- Fonts (self-hosted via `@fontsource-variable`): **Bricolage Grotesque** for headings (`font-display`), **DM Sans** for body (`font-sans`). Do not use `var(--font-*)` — it was undefined before and caused Times New Roman fallback.
- Colors (`tailwind.config.ts`): `ink` #16141F (primary buttons, headings); `slate-*` retuned to soft violet-greys; `indigo-*` retuned to Utilby violet; category colors `pdf` (coral), `img` (blue), `txt` (lime), `dev` (violet), `sec` (mint), `calc` (sun) each with `-soft` tints; `sun` #FFC53D highlight.
- Shapes: rounded cards (`rounded-3xl`/`rounded-[22px]`), pill nav/chips, soft shadows (`shadow-soft`, `shadow-lift`).
- Icon language: colored category tiles with a short glyph (`ToolGlyph`, `CategoryGlyph` in `components/shared/ToolGlyph.tsx`).
- Primary action = `bg-ink` button. Selected states should use ink or the category color (see TODO 6).
- Motion: subtle `animate-fade-up` / `.stagger`; `prefers-reduced-motion` is respected globally.
- Canvas with the 3 original design directions: https://claude.ai/artifact/EKrmz6WbBwMVpxgFG5MsRk (B was chosen).

## Agreed next steps (owner wants them one at a time, in this order)
1. ~~Hide empty ad placeholders~~ — done (8d2a5c5).
2. ~~Compact tool hero~~ — done (shrink `ToolLayout` hero: smaller glyph/h1, shorter subtitle, tighter padding so tool is visible without scrolling on mobile).
3. ~~Reduce repeated privacy messaging~~ — done (one clear statement per page: hero pill on tool pages, #promise on homepage, removed duplicate sidebar box, workspace hints, and footer badge).
4. **Favicon + Open Graph share images** (site-wide and per tool; static export → generate PNGs at build time or commit them in `public/og/`).
5. ~~Category landing pages~~ — done (`/pdf-tools`, `/image-tools`, `/text-tools`, `/developer-tools`, `/calculators`, `/security-tools` + aliases with `CollectionPage`, `ItemList` sitelinks, `FAQPage` schema, AdSense slots, and removed duplicate tool list from homepage).
6. ~~Unify inner tool UI colors~~ — done (QR tabs/EC buttons, PDF toolbar, compressor/resizer controls unified to `bg-ink text-white` selected states and `accent-ink`).
7. ~~Shorter, plain-language tool names/descriptions~~ — done (concise tool registry entries and consistent `<Tool> – <Benefit> | Utilby` page titles).
8. ~~Restyle legal pages~~ — done (About, Contact, Privacy, Terms, Disclaimer fully redesigned in Playful Color light aesthetic).
9. ~~Lazy-load pdf-lib~~ — done (PDF page initial bundles dropped from 309 kB to 134 kB — 56% load reduction).
10. ~~Cloudflare Web Analytics~~ — done (cookie-free analytics configured in `src/lib/analytics-config.ts` via `NEXT_PUBLIC_CF_ANALYTICS_TOKEN`).

Then: PDF Editor (text, images, signature, draw, highlight, whiteout), PDF Compressor, Watermark, Page Numbers, PDF→JPG.

## Gotchas
- `node_modules` on the owner's Mac are macOS-native; a Linux sandbox must run its own `npm ci` in a separate copy.
- New dependencies added recently: `qrcode`, `fflate`, `pdf-lib`, `pdfjs-dist@4.10.38`, `@fontsource-variable/*`. Run `npm install` locally before `npm run dev`.
- Don't import constants from a `"use client"` module into a server component (they become client references and are always truthy). Put shared config in `src/lib/`.
- **Security:** the git remote URL in `.git/config` contains a GitHub personal access token in plain text. Rotate it and switch to a credential helper.
