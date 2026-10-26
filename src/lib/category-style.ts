import type { ToolMeta } from "./tools-registry";

export type CategoryId = ToolMeta["category"];

export interface CategoryStyle {
  /** Solid swatch class (backgrounds of icon tiles) */
  solid: string;
  /** Soft tint class (card backgrounds) */
  soft: string;
  /** Short glyph shown inside the tile */
  glyph: string;
  /** Hex values for places that need raw colors */
  hex: string;
  softHex: string;
}

export const CATEGORY_STYLES: Record<CategoryId, CategoryStyle> = {
  pdf: { solid: "bg-pdf", soft: "bg-pdf-soft", glyph: "PDF", hex: "#FF5A36", softHex: "#FFF0EC" },
  image: { solid: "bg-img", soft: "bg-img-soft", glyph: "IMG", hex: "#2F9BFF", softHex: "#EAF4FF" },
  text: { solid: "bg-txt", soft: "bg-txt-soft", glyph: "Aa", hex: "#B6E33B", softHex: "#F3FBE3" },
  developer: { solid: "bg-dev", soft: "bg-dev-soft", glyph: "{ }", hex: "#9B85FF", softHex: "#F1EEFF" },
  security: { solid: "bg-sec", soft: "bg-sec-soft", glyph: "***", hex: "#19C39B", softHex: "#E7F8F2" },
  calculators: { solid: "bg-calc", soft: "bg-calc-soft", glyph: "%", hex: "#FFC53D", softHex: "#FFF6DD" },
};

/** Per-tool glyph overrides so tiles are recognisable at a glance. */
const TOOL_GLYPHS: Record<string, string> = {
  "word-counter": "123",
  "text-case-converter": "Aa",
  "json-formatter": "{ }",
  "qr-code-generator": "QR",
  "percentage-calculator": "%",
  "password-generator": "***",
  "image-compressor": "KB",
  "image-resizer": "↔",
  "heic-to-jpg": "HEIC",
  "image-background-remover": "BG",
  "pdf-merger": "+",
  "split-pdf": "✂",
  "organize-pdf": "⇅",
  "rotate-pdf": "↻",
  "delete-pdf-pages": "−",
  "extract-pdf-pages": "⇱",
  "jpg-to-pdf": "JPG",
  "pdf-to-jpg": "IMG",
  "pdf-editor": "✎",
  "pdf-compressor": "ZIP",
  "add-page-numbers-pdf": "Pg#",
};

export function toolGlyph(tool: Pick<ToolMeta, "id" | "category">): string {
  return TOOL_GLYPHS[tool.id] ?? CATEGORY_STYLES[tool.category].glyph;
}

/** Display order of categories across the site (most-used first). */
export const CATEGORY_ORDER: CategoryId[] = ["pdf", "image", "developer", "text", "security", "calculators"];

/** Hand-picked "most loved" tools for the homepage. */
export const POPULAR_TOOL_IDS = [
  "pdf-merger",
  "pdf-editor",
  "pdf-to-jpg",
  "heic-to-jpg",
  "image-background-remover",
  "image-compressor",
  "jpg-to-pdf",
  "split-pdf",
  "image-resizer",
  "qr-code-generator",
  "word-counter",
  "json-formatter",
];
