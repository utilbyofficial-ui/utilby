export interface ToolMeta {
  id: string;
  name: string;
  slug: string;
  category: "text" | "developer" | "calculators" | "security" | "image" | "pdf";
  categoryName: string;
  shortDescription: string;
  longDescription: string;
  iconName: string;
  isReady: boolean;
  featured?: boolean;
  keywords: string[];
}

export const CATEGORIES = [
  { id: "text", name: "Text Tools", description: "Format, analyze, and convert text instantly in your browser." },
  { id: "developer", name: "Developer Tools", description: "JSON formatters, validators, and dev utilities with zero server upload." },
  { id: "calculators", name: "Calculators", description: "Fast, accurate financial, math, and percentage calculators with formulas." },
  { id: "security", name: "Security Tools", description: "Client-side cryptographic password generators and privacy utilities." },
  { id: "image", name: "Image Tools", description: "Compress, resize, and convert images directly in browser Web Workers." },
  { id: "pdf", name: "PDF Tools", description: "Merge, compress, and organize PDF documents locally with zero data risk." },
] as const;

export const TOOLS: ToolMeta[] = [
  {
    id: "word-counter",
    name: "Word Counter",
    slug: "word-counter",
    category: "text",
    categoryName: "Text Tools",
    shortDescription: "Count words, characters, sentences, paragraphs, and calculate reading time in real-time.",
    longDescription: "A fast, accurate, client-side word counter and text statistics analyzer with real-time reading time and keyword density analysis.",
    iconName: "FileText",
    isReady: true,
    featured: true,
    keywords: ["word counter", "character counter", "word count tool", "reading time calculator", "text analyzer", "sentence counter"],
  },
  {
    id: "json-formatter",
    name: "JSON Formatter & Validator",
    slug: "json-formatter",
    category: "developer",
    categoryName: "Developer Tools",
    shortDescription: "Prettify, minify, validate JSON, and identify syntax errors with exact line numbers.",
    longDescription: "Clean, indent, validate, and minify your JSON data with pinpoint syntax error markers and instant clipboard copy.",
    iconName: "Code2",
    isReady: true,
    featured: true,
    keywords: ["json formatter", "json validator", "json beautifier", "format json online", "minify json", "json parser"],
  },
  {
    id: "percentage-calculator",
    name: "Percentage Calculator",
    slug: "percentage-calculator",
    category: "calculators",
    categoryName: "Calculators",
    shortDescription: "Calculate percentages, percentage change, increase, decrease, and discounts with step-by-step formulas.",
    longDescription: "An all-in-one percentage calculator to find what is X% of Y, percentage increase/decrease, ratios, and retail discounts.",
    iconName: "Percent",
    isReady: true,
    featured: true,
    keywords: ["percentage calculator", "calculate percentage", "discount calculator", "percentage change calculator", "reverse percentage"],
  },
  {
    id: "text-case-converter",
    name: "Text Case Converter",
    slug: "text-case-converter",
    category: "text",
    categoryName: "Text Tools",
    shortDescription: "Convert text to UPPERCASE, lowercase, Title Case, Sentence case, and remove duplicate lines.",
    longDescription: "Instantly transform your text case format, eliminate duplicate lines, and strip unnecessary whitespace cleanly.",
    iconName: "Type",
    isReady: true,
    featured: true,
    keywords: ["text case converter", "uppercase converter", "title case generator", "sentence case", "remove duplicate lines"],
  },
  {
    id: "password-generator",
    name: "Password Generator",
    slug: "password-generator",
    category: "security",
    categoryName: "Security Tools",
    shortDescription: "Generate strong, cryptographically secure random passwords client-side with zero data storage.",
    longDescription: "Create ultra-secure, randomized passwords with customizable length, symbols, entropy strength meter, and complete browser privacy.",
    iconName: "ShieldCheck",
    isReady: true,
    featured: true,
    keywords: ["password generator", "random password generator", "secure password", "strong password generator", "crypto password generator"],
  },
  // Roadmap Tools (Phase 2 & 3 - displayed as coming soon in directory)
  {
    id: "image-resizer",
    name: "Image Resizer",
    slug: "image-resizer",
    category: "image",
    categoryName: "Image Tools",
    shortDescription: "Resize images to exact pixel dimensions, maintain aspect ratio, and export to WebP/JPG/PNG.",
    longDescription: "Fast browser-based image resizer with social media presets and zero server uploads.",
    iconName: "Maximize2",
    isReady: false,
    keywords: ["image resizer", "resize image online", "resize photo to pixels"],
  },
  {
    id: "image-compressor",
    name: "Image Compressor",
    slug: "image-compressor",
    category: "image",
    categoryName: "Image Tools",
    shortDescription: "Reduce JPG, PNG, and WebP file sizes drastically without sacrificing visual quality.",
    longDescription: "Client-side image compression with quality slider and instant size reduction preview.",
    iconName: "Minimize2",
    isReady: false,
    keywords: ["image compressor", "compress jpg", "reduce image size"],
  },
  {
    id: "qr-code-generator",
    name: "QR Code Generator",
    slug: "qr-code-generator",
    category: "developer",
    categoryName: "Developer Tools",
    shortDescription: "Generate custom QR codes for URLs, text, Wi-Fi networks, and contact vCards in SVG and PNG.",
    longDescription: "High-resolution vector and raster QR code generator with custom styling and instant download.",
    iconName: "QrCode",
    isReady: false,
    keywords: ["qr code generator", "create qr code free", "wifi qr code"],
  },
  {
    id: "pdf-merger",
    name: "PDF Merger",
    slug: "pdf-merger",
    category: "pdf",
    categoryName: "PDF Tools",
    shortDescription: "Combine multiple PDF documents into a single organized file directly in your browser.",
    longDescription: "Drag and drop PDF merger with custom page ordering and 100% client-side privacy.",
    iconName: "Combine",
    isReady: false,
    keywords: ["merge pdf", "combine pdf files", "pdf joiner"],
  },
  {
    id: "pdf-compressor",
    name: "PDF Compressor",
    slug: "pdf-compressor",
    category: "pdf",
    categoryName: "PDF Tools",
    shortDescription: "Compress PDF file sizes for email and web upload with client-side optimization.",
    longDescription: "Efficient PDF compression tool preserving text legibility and document formatting.",
    iconName: "FileArchive",
    isReady: false,
    keywords: ["pdf compressor", "compress pdf online", "reduce pdf size"],
  },
];
