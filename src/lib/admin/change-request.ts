/**
 * Turns edits made in the owner dashboard into a precise, copy-pasteable instruction that a coding
 * agent (Antigravity / Claude) can apply to the codebase. Nothing is written to any server.
 */

export interface EditableToolContent {
  name: string;
  shortDescription: string;
  longDescription: string;
  keywords: string;
  metaTitle: string;
  metaDescription: string;
}

export const FIELD_INFO: Record<keyof EditableToolContent, { label: string; where: (slug: string) => string }> = {
  name: { label: "টুলের নাম", where: () => "src/lib/tools-registry.ts → name" },
  shortDescription: { label: "ছোট বিবরণ (কার্ডে দেখায়)", where: () => "src/lib/tools-registry.ts → shortDescription" },
  longDescription: { label: "বড় বিবরণ", where: () => "src/lib/tools-registry.ts → longDescription" },
  keywords: { label: "কিওয়ার্ড", where: () => "src/lib/tools-registry.ts → keywords (এবং পেজের metadata.keywords)" },
  metaTitle: {
    label: "Google টাইটেল (meta title)",
    where: (slug) => `src/app/tools/${slug}/page.tsx → metadata.title ও openGraph.title (PDF টুল হলে src/modules/pdf/seo.ts)`,
  },
  metaDescription: {
    label: "Google ডেসক্রিপশন (meta description)",
    where: (slug) => `src/app/tools/${slug}/page.tsx → metadata.description ও openGraph.description (PDF টুল হলে src/modules/pdf/seo.ts)`,
  },
};

const FIELD_ORDER = Object.keys(FIELD_INFO) as (keyof EditableToolContent)[];

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

export function changedFields(original: EditableToolContent, edited: EditableToolContent): (keyof EditableToolContent)[] {
  return FIELD_ORDER.filter((k) => norm(original[k]) !== norm(edited[k]));
}

export function buildChangeRequest(
  tool: { name: string; slug: string },
  original: EditableToolContent,
  edited: EditableToolContent
): string {
  const fields = changedFields(original, edited);
  if (!fields.length) return "";
  const lines: string[] = [
    `Utilby কনটেন্ট আপডেট — ${tool.name} (https://utilby.com/tools/${tool.slug})`,
    "",
    "নির্দেশ: আগে `git pull origin main` করো। তারপর নিচের লেখাগুলো হুবহু বদলাও, `npm test` ও `npm run build` চালাও, সব ঠিক থাকলে commit করে `git push origin main` করো।",
    "",
  ];
  fields.forEach((k, i) => {
    const info = FIELD_INFO[k];
    lines.push(`${i + 1}. ${info.label}`);
    lines.push(`   ফাইল: ${info.where(tool.slug)}`);
    lines.push(`   আগে: ${norm(original[k]) || "(খালি)"}`);
    lines.push(`   এখন: ${norm(edited[k]) || "(খালি)"}`);
    lines.push("");
  });
  return lines.join("\n").trimEnd() + "\n";
}
