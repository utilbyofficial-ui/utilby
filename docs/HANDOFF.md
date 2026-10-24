# Utilby — AI Handoff & Project Guide (2026-10-24)

> **For all AI Collaborators (Antigravity, Claude, ChatGPT Pro):**  
> Read this file first. It is the single source of truth for the project.  
> Live site: https://utilby.com (Hosted on Cloudflare Pages, auto-deploys from GitHub `main`).

---

## 1. Golden Rules for Multi-AI Collaboration (Zero Conflicts)
1. **Always Pull First:** Run `git pull origin main` before touching any code. Never make assumptions about local state.
2. **Quality Gate:** Before every commit/push, **both** `npm test` (Vitest) and `npm run build` (Next.js SSG) **must pass cleanly** with 0 errors.
3. **100% Client-Side Privacy:** All tools MUST run 100% in the user's browser. Zero file uploads, zero backend APIs, zero database, zero external tracking.
4. **Google AdSense & DMCA Safety:** Never build tools that violate copyright (e.g. video downloaders for YouTube, TikTok, Facebook, Instagram) or scrape copyrighted content. Every tool must remain 100% white-hat and AdSense-safe.
5. **Single Feature at a Time:** Work on one tool or improvement at a time to prevent merge conflicts.
6. **Handoff Method:**
   - **Direct Edit (if AI has terminal/file access):** Edit files ➔ `npm test` ➔ `npm run build` ➔ `git commit` ➔ `git push origin main`.
   - **Chat/Patch Mode (if AI only generates text/files):** Output code diffs or `git format-patch` (`.patch` file). Antigravity will apply it using `git am <file>.patch`, test, and push.

---

## 2. Tech Stack & Architecture
- **Framework:** Next.js 15 (App Router), `output: "export"` (Static Site Generation into `out/`).
- **Language & Styling:** TypeScript, Tailwind CSS 3 (custom "Playful Color" system), Lucide React.
- **Testing:** Vitest (`npm test`). Currently **108/108 tests passing** across 15 test suites.
- **Fonts (Self-hosted):** Bricolage Grotesque (`font-display`) for headings, DM Sans (`font-sans`) for body.
- **Hosting & DNS:** Cloudflare Pages with auto-build on git push, custom domain `utilby.com`.

---

## 3. Core Project Structure & Key Files
- `src/lib/tools-registry.ts` — **Single source of truth** for all tools (`TOOLS` array: id, name, slug, category, `isReady`, description, keywords).
- `src/lib/category-style.ts` — Category colors (`pdf`, `image`, `text`, `developer`, `security`, `calculators`), `TOOL_GLYPHS`, and `POPULAR_TOOL_IDS`.
- `src/modules/<tool-name>/` — Isolated tool logic:
  - `engine.ts`: Pure functions only (business logic, math, conversions).
  - `engine.test.ts`: Vitest unit tests for the engine.
  - `<ToolName>Tool.tsx`: `"use client"` React UI component.
- `src/app/tools/<slug>/page.tsx` — Metadata (SEO title, description, canonical, OpenGraph) + `<ToolLayout>`.
- `src/components/shared/ToolLayout.tsx` — Shared tool frame (breadcrumbs, hero, tool component, related tools, FAQs, schema.org JSON-LD).
- `src/app/tools/page.tsx` & `src/components/tools/ToolsDirectory.tsx` — Full catalog directory page with real-time category filtering.
- `src/components/layout/Header.tsx` — Sticky header with category dropdown menus and "All tools" link.
- `src/app/admin/` & `src/components/admin/` — Private Owner Dashboard (Bangla UI):
  - In-browser live SEO & AdSense audit across all 30+ sitemap pages (`SeoPanel.tsx`, `seo-audit.ts`).
  - Visual Content Editor with real-time character counter and Google search preview (`EditorPanel.tsx`).
  - Next tool launch checklist and idea scratchpad (`RoadmapPanel.tsx`).
  - Security links and Cloudflare Access integration guide (`LinksPanel.tsx`).

---

## 4. Current Live Tools (17 Ready Tools)
1. **PDF Suite (8 Tools):**
   - PDF Merger (`/tools/pdf-merger`)
   - Split PDF (`/tools/split-pdf`)
   - Organize PDF (`/tools/organize-pdf`)
   - Rotate PDF (`/tools/rotate-pdf`)
   - Delete PDF Pages (`/tools/delete-pdf-pages`)
   - Extract PDF Pages (`/tools/extract-pdf-pages`)
   - JPG to PDF (`/tools/jpg-to-pdf`)
   - PDF to JPG (`/tools/pdf-to-jpg`)
   - PDF Editor (`/tools/pdf-editor` — full in-browser editor with real text removal in PDF content streams, 8-handle resizing, signatures, annotations, and rotation-safe geometry).
2. **Image Tools (2 Tools):**
   - Image Compressor (`/tools/image-compressor`)
   - Image Resizer (`/tools/image-resizer`)
3. **Text Tools (2 Tools):**
   - Word Counter (`/tools/word-counter`)
   - Text Case Converter (`/tools/text-case-converter`)
4. **Developer Tools (2 Tools):**
   - JSON Formatter & Validator (`/tools/json-formatter`)
   - Custom QR Code Generator (`/tools/qr-code-generator`)
5. **Security Tools (1 Tool):**
   - Password Generator (`/tools/password-generator`)
6. **Calculators (1 Tool):**
   - Percentage Calculator (`/tools/percentage-calculator`)

---

## 5. Upcoming Roadmap (Next Tools to Build)
The project owner wants tools built **one by one**, ensuring 100% test coverage and flawless UI:
1. **PDF Compressor** (In-browser compression: image downsampling, stream deduplication, preservation of vector text).
2. **Watermark PDF** (Text & image watermark stamps with opacity, rotation, and custom positioning).
3. **Page Numbers** (Custom numbering format, placement, margins, start page).
4. **Base64 Encoder / Decoder** (Developer category).
5. **Markdown Previewer & HTML Exporter** (Text category).

---

## 6. How to Add a New Tool (Standard 6-Step Checklist)
1. **Engine:** Create `src/modules/<slug>/engine.ts` with pure TypeScript functions only.
2. **Unit Tests:** Create `src/modules/<slug>/engine.test.ts` and ensure all test cases pass with `npm test`.
3. **UI Component:** Create `src/modules/<slug>/<Name>Tool.tsx` (`"use client"`). Follow the "Playful Color" design system (ink buttons `#16141F`, soft cards, drag-and-drop file inputs).
4. **Page & SEO:** Create `src/app/tools/<slug>/page.tsx` with metadata, canonical URL, and `<ToolLayout>`.
5. **Registry:** Add the tool to `src/lib/tools-registry.ts` (`isReady: true`) and its glyph to `src/lib/category-style.ts` (`TOOL_GLYPHS`).
6. **Verification:** Run `npm test` and `npm run build`. If both pass, commit and push!
