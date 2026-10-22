# Utilby — Handoff Notes (2026-10-22)

Read this before changing anything. Live site: https://utilby.com (Cloudflare Pages, auto-deploys `main`).

## Working rules (from the project owner)
1. `git pull origin main` before starting — two AI agents work on this repo.
2. Before pushing: `npm run build` **and** `npm test` must pass.
3. Every tool is 100% client-side. No user data may ever be sent to a server.
4. Design: clean, premium, light theme (see Design system below).
5. **100% AdSense & Domain Safety:** Never add tools that download copyrighted media (YouTube/TikTok/FB/IG video downloaders), scrapers, or anything violating Google AdSense / DMCA policies. Keep the entire site 100% white-hat, legal, and AdSense-compliant.

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

## Live tools (18)
Text: Word Counter, Text Case Converter · Developer: JSON Formatter, QR Code Generator · Calculators: Percentage · Security: Password Generator · Image: Image Compressor, Image Resizer · PDF: Merge, Split, Organize, Rotate, Delete Pages, Extract Pages, JPG to PDF, PDF to JPG, PDF Editor.
Coming soon (registry, `isReady: false`): PDF Compressor, Watermark, Page Numbers.

## PDF toolkit architecture (`src/modules/pdf/` and `src/modules/pdf-editor/`)
- `pages.ts` — pure page model (move, rotate, delete, duplicate, blank pages, range parsing). Fully tested.
- `build.ts` — builds output PDFs with **pdf-lib** (lossless page copy, image embedding, rotation). Tested in Node.
- `image.ts` — EXIF orientation reader + image preparation for embedding.
- `render.ts` — **PDF.js** thumbnails, lazy-loaded. Worker is served from `public/vendor/pdfjs/pdf.worker-4.10.38.min.js`. **If you upgrade `pdfjs-dist`, copy the new worker file and update `PDFJS_WORKER_SRC`** — versions must match exactly.
- `src/modules/pdf-editor/` — PDF Editor (rebuilt 2026-10-22 after live testing):
  - `engine.ts` — `exportPdfWithAnnotations(bytes, annotations, { rasterizeText })`. Maps display coords to PDF space for **rotated pages and offset CropBoxes** (`geometry.ts`), **really removes original text under every whiteout** from the content stream (`contentStream.ts` — edited/deleted text can no longer be searched or copied), embeds images by sniffing PNG/JPEG bytes, and falls back to rasterized text for characters the standard fonts can't encode (Bengali, emoji, ✓ …). `buildCombinedAnnotations` orders erase patches → user annotations → replacement text, and skips lines that were opened but not changed.
  - `toDisplayTextItems` + `groupPdfTextItems` — detect editable lines in display space (rotation-aware); fonts resolved from PDF.js `commonObjs` (keeps bold/serif/mono), colours sampled from the rendered page (`sampleTextColor`).
  - `elements.ts` — pure move/resize math (8 handles, aspect lock on corners, drawings scale), `fitImageBox` keeps real image proportions.
  - `media.ts` — image normalisation (WebP/GIF/BMP → PNG/JPEG, EXIF orientation, 2400 px cap, signature trimming) and `rasterizeText`.
  - `PdfEditorTool.tsx` — UI: fixed-height properties bar (no layout jump), drag-to-move any element, resize handles (touch-sized on coarse pointers), Replace image, Keep proportions, duplicate / bring to front, font-size handle on text, unified undo/redo for annotations **and** existing-text edits, keyboard nudge (arrows), touch-safe pointer handling (`claimPointer`).
  - Tests: `engine.test.ts`, `editing.test.ts` (tokenizer, text removal, geometry, export, resize).
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
4. ~~Favicon + Open Graph share images~~ — done (Official final icon: U-mark with golden sun orb. Generated favicon suite, apple touch icons, automated 1200x630 OG banners for all tools & categories, and Master Brand Kit with SVG/AI and 2048x2048 PNGs in `public/brand-kit/`).
5. ~~Category landing pages~~ — done (`/pdf-tools`, `/image-tools`, `/text-tools`, `/developer-tools`, `/calculators`, `/security-tools` + aliases with `CollectionPage`, `ItemList` sitelinks, `FAQPage` schema, AdSense slots, and removed duplicate tool list from homepage).
6. ~~Unify inner tool UI colors~~ — done (QR tabs/EC buttons, PDF toolbar, compressor/resizer controls unified to `bg-ink text-white` selected states and `accent-ink`).
7. ~~Shorter, plain-language tool names/descriptions~~ — done (concise tool registry entries and consistent `<Tool> – <Benefit> | Utilby` page titles).
8. ~~Restyle legal pages~~ — done (About, Contact, Privacy, Terms, Disclaimer fully redesigned in Playful Color light aesthetic).
9. ~~Lazy-load pdf-lib~~ — done (PDF page initial bundles dropped from 309 kB to 134 kB — 56% load reduction).
10. ~~Cloudflare Web Analytics~~ — done (cookie-free analytics configured in `src/lib/analytics-config.ts` via `NEXT_PUBLIC_CF_ANALYTICS_TOKEN`).

11. ~~PDF to JPG Converter~~ — done (4f866b5, 72/150/300 DPI, JPG/PNG, ZIP download).
12. ~~PDF Editor~~ — done (c373915, in-browser vector text editing, drag-to-replace, smart background matching cut-and-move for graphics, signatures, pen, highlights, whiteout).

Next tools in queue (one by one):
- **PDF Compressor** (lossless & lossy PDF compression, DPI downsampling, image stream re-encoding, preservation of vector text).
- **Watermark PDF** (text & image watermark stamps).
- **Page Numbers** (custom numbering format, placement, margins).

## Gotchas
- `node_modules` on the owner's Mac are macOS-native; a Linux sandbox must run its own `npm ci` in a separate copy.
- New dependencies added recently: `qrcode`, `fflate`, `pdf-lib`, `pdfjs-dist@4.10.38`, `@fontsource-variable/*`. Run `npm install` locally before `npm run dev`.
- Don't import constants from a `"use client"` module into a server component (they become client references and are always truthy). Put shared config in `src/lib/`.
- **Security:** the git remote URL in `.git/config` contains a GitHub personal access token in plain text. Rotate it and switch to a credential helper.
