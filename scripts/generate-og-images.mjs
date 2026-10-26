import fs from "fs";
import path from "path";
import sharp from "sharp";

// We read TOOLS and CATEGORIES from registry
// Since this is an ESM script, let's extract them cleanly
const registryFile = fs.readFileSync(path.resolve("src/lib/tools-registry.ts"), "utf-8");

// Simple extractor for TOOLS array from src/lib/tools-registry.ts
const toolsMatch = registryFile.match(/export const TOOLS: ToolMeta\[\] = (\[[\s\S]*?\]);/);
let tools = [];
if (toolsMatch) {
  // Use function evaluation on the sanitized array string
  try {
    const raw = toolsMatch[1]
      .replace(/iconName:\s*["'][^"']+["'],?/g, "")
      .replace(/keywords:\s*\[[\s\S]*?\],?/g, "");
    tools = (new Function(`return ${raw}`))();
  } catch {
    console.warn("Could not parse tools dynamically, using fallback list");
  }
}

if (!tools.length) {
  tools = [
    { id: "word-counter", name: "Word Counter", slug: "word-counter", category: "text", categoryName: "Text Tools", shortDescription: "Count words, characters, sentences, and estimated reading time." },
    { id: "json-formatter", name: "JSON Formatter", slug: "json-formatter", category: "developer", categoryName: "Developer Tools", shortDescription: "Format, validate, beautify, and minify your JSON data." },
    { id: "percentage-calculator", name: "Percentage Calculator", slug: "percentage-calculator", category: "calculators", categoryName: "Calculators", shortDescription: "Calculate percentages, percentage differences, and retail discounts." },
    { id: "text-case-converter", name: "Text Case Converter", slug: "text-case-converter", category: "text", categoryName: "Text Tools", shortDescription: "Convert text to UPPERCASE, lowercase, Title Case, and Sentence case." },
    { id: "password-generator", name: "Password Generator", slug: "password-generator", category: "security", categoryName: "Security Tools", shortDescription: "Generate strong, cryptographically secure passwords in your browser." },
    { id: "image-resizer", name: "Image Resizer", slug: "image-resizer", category: "image", categoryName: "Image Tools", shortDescription: "Resize images to custom dimensions, percentages, or social media presets." },
    { id: "image-compressor", name: "Image Compressor", slug: "image-compressor", category: "image", categoryName: "Image Tools", shortDescription: "Reduce JPG, PNG, and WebP file sizes without losing visual quality." },
    { id: "qr-code-generator", name: "QR Code Generator", slug: "qr-code-generator", category: "developer", categoryName: "Developer Tools", shortDescription: "Create custom QR codes for URLs, Wi-Fi networks, contacts, and text." },
    { id: "pdf-merger", name: "Merge PDF", slug: "pdf-merger", category: "pdf", categoryName: "PDF Tools", shortDescription: "Combine multiple PDF files and images into a single document." },
    { id: "split-pdf", name: "Split PDF", slug: "split-pdf", category: "pdf", categoryName: "PDF Tools", shortDescription: "Separate PDF pages into individual files or extract custom ranges." },
    { id: "organize-pdf", name: "Organize PDF", slug: "organize-pdf", category: "pdf", categoryName: "PDF Tools", shortDescription: "Rearrange, rotate, duplicate, or delete PDF pages with drag and drop." },
    { id: "rotate-pdf", name: "Rotate PDF", slug: "rotate-pdf", category: "pdf", categoryName: "PDF Tools", shortDescription: "Rotate single PDF pages or all pages permanently by 90°, 180°, or 270°." },
    { id: "delete-pdf-pages", name: "Delete PDF Pages", slug: "delete-pdf-pages", category: "pdf", categoryName: "PDF Tools", shortDescription: "Remove unwanted, duplicate, or blank pages from your PDF." },
    { id: "extract-pdf-pages", name: "Extract PDF Pages", slug: "extract-pdf-pages", category: "pdf", categoryName: "PDF Tools", shortDescription: "Extract and save selected pages or ranges into a new PDF." },
    { id: "jpg-to-pdf", name: "JPG to PDF", slug: "jpg-to-pdf", category: "pdf", categoryName: "PDF Tools", shortDescription: "Convert JPG, PNG, and WebP images into a PDF document." },
  ];
}

const CATEGORY_COLORS = {
  pdf: { color: "#FF5C5C", name: "PDF Tools" },
  image: { color: "#3B82F6", name: "Image Tools" },
  text: { color: "#84CC16", name: "Text Tools" },
  developer: { color: "#8B5CF6", name: "Developer Tools" },
  calculators: { color: "#FFC53D", name: "Calculators" },
  security: { color: "#10B981", name: "Security Tools" },
};

const ogDir = path.resolve("public/og");
const ogToolsDir = path.resolve("public/og/tools");
fs.mkdirSync(ogToolsDir, { recursive: true });

function escapeXml(unsafe) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateSvg({ title, categoryName, categoryColor, description, badge = "100% In-Browser & Private" }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1B1826"/>
      <stop offset="100%" stop-color="#0F0D16"/>
    </linearGradient>
    <radialGradient id="glow" cx="85%" cy="15%" r="65%">
      <stop offset="0%" stop-color="${categoryColor}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${categoryColor}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sun" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFDB70"/>
      <stop offset="100%" stop-color="#FFB31A"/>
    </linearGradient>
  </defs>

  <!-- Background Base -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Top Bar: Logo & Category -->
  <g transform="translate(80, 70)">
    <!-- Logo Icon -->
    <rect width="56" height="56" rx="16" fill="#FFFFFF"/>
    <circle cx="28" cy="28" r="12" fill="url(#sun)"/>
    <!-- Wordmark -->
    <text x="74" y="41" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="800" fill="#FFFFFF" letter-spacing="-1">utilby</text>
  </g>

  <!-- Category Tag -->
  <g transform="translate(820, 70)">
    <rect width="300" height="48" rx="24" fill="${categoryColor}" fill-opacity="0.15" stroke="${categoryColor}" stroke-opacity="0.4" stroke-width="1.5"/>
    <circle cx="24" cy="24" r="5" fill="${categoryColor}"/>
    <text x="38" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#FFFFFF">${escapeXml(categoryName)}</text>
  </g>

  <!-- Main Title -->
  <text x="80" y="270" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="68" font-weight="900" fill="#FFFFFF" letter-spacing="-1.5">
    ${escapeXml(title)}
  </text>

  <!-- Subtitle / Description -->
  <text x="80" y="335" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="400" fill="#94A3B8">
    ${escapeXml(description.length > 80 ? description.slice(0, 77) + "..." : description)}
  </text>

  <!-- Divider -->
  <line x1="80" y1="420" x2="1120" y2="420" stroke="#FFFFFF" stroke-opacity="0.1" stroke-width="1"/>

  <!-- Bottom Badges -->
  <g transform="translate(80, 480)">
    <g transform="translate(0, 0)">
      <circle cx="12" cy="12" r="4" fill="#10B981"/>
      <text x="26" y="17" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600" fill="#CBD5E1">${escapeXml(badge)}</text>
    </g>
    <g transform="translate(340, 0)">
      <circle cx="12" cy="12" r="4" fill="#FFC53D"/>
      <text x="26" y="17" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600" fill="#CBD5E1">Zero Uploads · Offline Ready</text>
    </g>
    <g transform="translate(740, 0)">
      <circle cx="12" cy="12" r="4" fill="#818CF8"/>
      <text x="26" y="17" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600" fill="#CBD5E1">utilby.com</text>
    </g>
  </g>
</svg>`;
}

async function buildPng(svgContent, targetPngPath) {
  await sharp(Buffer.from(svgContent)).png().toFile(targetPngPath);
}

const onlyToolSlug = process.argv[2];
if (onlyToolSlug && !tools.some((tool) => tool.slug === onlyToolSlug)) {
  throw new Error(`Unknown tool slug: ${onlyToolSlug}`);
}

console.log(onlyToolSlug ? `Generating Open Graph image for ${onlyToolSlug}...` : "Generating Open Graph images...");

if (!onlyToolSlug) {
  // 1. Site-wide default OG image
  const defaultSvg = generateSvg({
    title: "The Friendly Toolbox for Everyday Files",
    categoryName: "15+ Free In-Browser Tools",
    categoryColor: "#FFC53D",
    description: "Merge PDFs, shrink photos, generate QR codes, and more — free, instant, and 100% private.",
    badge: "100% In-Browser · No Sign-up",
  });
  await buildPng(defaultSvg, path.join(ogDir, "default.png"));
  console.log("✓ Generated public/og/default.png");

  // 2. Per-category OG images
  for (const [catId, conf] of Object.entries(CATEGORY_COLORS)) {
    const svg = generateSvg({
      title: `Free Online ${conf.name}`,
      categoryName: conf.name,
      categoryColor: conf.color,
      description: `Fast, private ${conf.name.toLowerCase()} that run 100% inside your browser. No server uploads.`,
    });
    await buildPng(svg, path.join(ogDir, `${catId}-tools.png`));
    console.log(`✓ Generated public/og/${catId}-tools.png`);
  }
}

// Generate all tool previews by default, or only the requested tool when a slug is passed.
for (const tool of tools.filter((candidate) => !onlyToolSlug || candidate.slug === onlyToolSlug)) {
  const cat = CATEGORY_COLORS[tool.category] ?? { color: "#FFC53D", name: tool.categoryName };
  const svg = generateSvg({
    title: tool.name,
    categoryName: cat.name,
    categoryColor: cat.color,
    description: tool.shortDescription,
  });
  await buildPng(svg, path.join(ogToolsDir, `${tool.slug}.png`));
  console.log(`✓ Generated public/og/tools/${tool.slug}.png`);
}

console.log("All Open Graph banners generated successfully!");
