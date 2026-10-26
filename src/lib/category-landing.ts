import { TOOLS, type ToolMeta } from "./tools-registry";
import { FaqItem } from "@/components/shared/FaqAccordion";

export interface CategoryLandingData {
  id: ToolMeta["category"];
  slug: string;
  aliases: string[];
  name: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  subtitle: string;
  highlightStats: string[];
  whyChooseHeading: string;
  whyChoosePoints: {
    title: string;
    description: string;
  }[];
  howToSteps: {
    step: string;
    title: string;
    description: string;
  }[];
  faqs: FaqItem[];
}

export const CATEGORY_LANDING_PAGES: Record<ToolMeta["category"], CategoryLandingData> = {
  pdf: {
    id: "pdf",
    slug: "pdf-tools",
    aliases: ["pdf", "pdf-tools"],
    name: "PDF Tools",
    seoTitle: "Free Online PDF Tools – 100% In-Browser & Private | Utilby",
    seoDescription:
      "Merge, split, organize, rotate, delete, extract pages, and convert PDFs in your browser. Tool-specific file limits apply; your documents are processed on your device.",
    h1: "Free Online PDF Tools",
    subtitle:
      "Fast, private utilities to organize, merge, split, and convert PDF documents in your browser. Your files never touch a remote server.",
    highlightStats: [
      "{count} Free Tools Available",
      "100% In-Browser Execution",
      "Tool-Specific File Limits",
      "No Account Required",
    ],
    whyChooseHeading: "Why Use Utilby's In-Browser PDF Suite?",
    whyChoosePoints: [
      {
        title: "Your documents stay on your device",
        description:
          "PDF tools process document contents in your browser. Your files are not uploaded to Utilby for processing, so you can work without sending the document to a remote conversion queue.",
      },
      {
        title: "No account or daily quota",
        description:
          "Use the tools without creating an account or waiting in a cloud conversion queue. Each workspace shows its file and page limits, and large documents may need more memory on your device.",
      },
      {
        title: "Designed for local processing",
        description:
          "After a tool and its required resources have loaded, many PDF operations can continue without a connection. Check the tool page for details and limits.",
      },
    ],
    howToSteps: [
      {
        step: "1",
        title: "Select a PDF Utility",
        description: "Choose from Merge, Split, Organize, Rotate, Delete Pages, Extract, or JPG to PDF below.",
      },
      {
        step: "2",
        title: "Drop Your Documents",
        description: "Drag and drop one or multiple PDF files into the workspace. Instant visual thumbnails render automatically.",
      },
      {
        step: "3",
        title: "Reorder & Customize",
        description: "Rearrange pages, rotate orientations, or select specific page ranges with a single click.",
      },
      {
        step: "4",
        title: "Download Instantly",
        description: "Click Save to assemble and download your new PDF directly to your device without waiting in upload queues.",
      },
    ],
    faqs: [
      {
        question: "Are my PDF files uploaded to any server?",
        answer:
          "No. All PDF operations run locally inside your web browser using Mozilla's PDF.js and pdf-lib. Your documents never travel over the internet, and no server logs or copies are created.",
      },
      {
        question: "Is there a limit on how many PDF pages or files I can merge?",
        answer:
          "Limits vary by tool. The upload area shows the supported file size, file count, and page count. Your device's available memory can also affect large documents.",
      },
      {
        question: "Does merging or splitting degrade PDF text or image quality?",
        answer:
          "Page operations such as merging and splitting do not rasterize pages. PDF compression is different: it can re-encode supported images, so compare the output before using it.",
      },
      {
        question: "Can I use these PDF tools on mobile phones and tablets?",
        answer:
          "Yes. Utilby is fully responsive and supports touch drag-and-drop, page selection, and instant downloads across iOS, Android, macOS, Windows, and Linux.",
      },
    ],
  },

  image: {
    id: "image",
    slug: "image-tools",
    aliases: ["image", "image-tools", "images"],
    name: "Image Tools",
    seoTitle: "Free Online Image Tools – Compress & Resize Images In-Browser | Utilby",
    seoDescription:
      "Compress and resize JPG, PNG, and WebP images directly in your browser. Social media presets, bulk batch processing, and ZIP download with zero server uploads.",
    h1: "Free Online Image Tools",
    subtitle:
      "Compress and resize images in your browser, with adjustable quality and format options. Preview results before downloading.",
    highlightStats: [
      "Bulk Batch Processing",
      "Adjustable Quality Settings",
      "Social Media Presets",
      "Instant ZIP Export",
    ],
    whyChooseHeading: "High-Performance Image Optimization on Your Device",
    whyChoosePoints: [
      {
        title: "Zero Cloud Bandwidth Lag",
        description:
          "Compress and resize high-resolution photos up to the tool's 50 MB per-image limit without waiting for files to upload to a cloud queue.",
      },
      {
        title: "Choose the balance you need",
        description:
          "Adjust the quality setting and compare the result with the original before you download. The best setting depends on the image and how you plan to use it.",
      },
      {
        title: "Batch Download as ZIP",
        description:
          "Process up to 20 images per batch and download the optimized collection as a single ZIP file.",
      },
    ],
    howToSteps: [
      {
        step: "1",
        title: "Select an Image Tool",
        description: "Choose Image Compressor to reduce file weight, or Image Resizer to change pixel dimensions.",
      },
      {
        step: "2",
        title: "Upload Photos in Bulk",
        description: "Drag and drop one or dozens of JPG, PNG, or WebP files into the tool interface.",
      },
      {
        step: "3",
        title: "Tune Settings",
        description: "Adjust the visual quality slider, choose dimension constraints, or select a ready-made social preset.",
      },
      {
        step: "4",
        title: "Export & Save",
        description: "Download individual photos or grab all optimized assets in a single convenient ZIP archive.",
      },
    ],
    faqs: [
      {
        question: "Do you store or see my uploaded photos?",
        answer:
          "Never. All image decoding, resizing, and compression execute inside your browser's Web Worker threads. Your photos never leave your device.",
      },
      {
        question: "What image formats are supported?",
        answer:
          "You can compress and resize JPG, JPEG, PNG, and WebP images. You can also convert formats (such as PNG to modern WebP) for dramatic bandwidth savings.",
      },
      {
        question: "Will compressing my photos make them look blurry?",
        answer:
          "Quality changes depend on the image and setting. Use the before-and-after preview to inspect the result, and raise the quality if you want to keep more detail.",
      },
    ],
  },

  text: {
    id: "text",
    slug: "text-tools",
    aliases: ["text", "text-tools"],
    name: "Text Tools",
    seoTitle: "Free Online Text Tools – Word Counter & Case Converter | Utilby",
    seoDescription:
      "Real-time word counter, character counter, sentence counter, reading time estimator, and text case converter. Format and analyze text instantly in your browser.",
    h1: "Free Online Text Tools",
    subtitle:
      "Precise text statistics, case transformations, and readability metrics for writers, students, editors, and developers with 100% privacy.",
    highlightStats: [
      "Real-Time Keystroke Analysis",
      "Unicode & Contraction Aware",
      "Estimated Reading & Speaking Time",
      "One-Click Case Transformation",
    ],
    whyChooseHeading: "Why Use Utilby's Text Analysis Tools?",
    whyChoosePoints: [
      {
        title: "Accurate Unicode Counting",
        description:
          "Our tokenizer correctly handles compound words, hyphenated terms, emojis, non-Latin scripts, and multi-byte characters with precision.",
      },
      {
        title: "Live Keystroke Updates",
        description:
          "No submit buttons. Words, characters with and without whitespace, sentences, and paragraphs calculate in sub-milliseconds as you type.",
      },
      {
        title: "Complete Writing Confidentiality",
        description:
          "Paste unpublished articles, confidential manuscripts, or essays safely without worrying about third-party AI training or server logging.",
      },
    ],
    howToSteps: [
      {
        step: "1",
        title: "Select a Text Utility",
        description: "Choose Word Counter for deep statistics or Text Case Converter for formatting adjustments.",
      },
      {
        step: "2",
        title: "Type or Paste Content",
        description: "Paste your text into the workspace or click Load Sample to inspect the metrics.",
      },
      {
        step: "3",
        title: "Inspect or Transform",
        description: "View real-time reading times, or click one-click buttons to convert to UPPERCASE, Title Case, or Sentence case.",
      },
      {
        step: "4",
        title: "Copy Result",
        description: "Click Copy to Clipboard to take your formatted text directly into your document or editor.",
      },
    ],
    faqs: [
      {
        question: "How is reading time calculated?",
        answer:
          "Reading time is calculated using the international standard adult reading speed of 200 words per minute (WPM), giving you an accurate benchmark for essays, speeches, and articles.",
      },
      {
        question: "Can I convert large text documents?",
        answer:
          "Yes. Because processing runs in your browser's V8 engine, you can analyze and convert tens of thousands of words in a fraction of a millisecond.",
      },
    ],
  },

  developer: {
    id: "developer",
    slug: "developer-tools",
    aliases: ["developer", "developer-tools", "dev"],
    name: "Developer Tools",
    seoTitle: "Free Online Developer Tools – JSON Formatter & QR Generator | Utilby",
    seoDescription:
      "Prettify, validate, and minify JSON payloads, pinpoint syntax errors with line markers, and generate vector QR codes in SVG and PNG directly in your browser.",
    h1: "Free Online Developer Tools",
    subtitle:
      "Zero-server developer utilities engineered for speed, clean code formatting, and confidential API payload debugging.",
    highlightStats: [
      "RFC 8259 Compliant JSON Lexer",
      "Exact Line Error Pinpointing",
      "SVG & PNG QR Code Export",
      "Zero Server Network Latency",
    ],
    whyChooseHeading: "Built for Confidential Developer Workflows",
    whyChoosePoints: [
      {
        title: "Never Leak Internal API Payloads",
        description:
          "Never paste proprietary client JSON, internal tokens, or user payloads into sketchy server-based beautifiers. Utilby formats data 100% locally in browser memory.",
      },
      {
        title: "Instant Syntax Debugging",
        description:
          "Find missing commas, unescaped quotes, or mismatched braces instantly with exact line numbers and helpful syntax hints.",
      },
      {
        title: "High-Resolution Vector QR Codes",
        description:
          "Generate clean QR codes for links, Wi-Fi networks, and contact vCards with sharp vector SVG export suitable for print and digital design.",
      },
    ],
    howToSteps: [
      {
        step: "1",
        title: "Select Developer Tool",
        description: "Choose JSON Formatter & Validator for code debugging, or QR Code Generator for scan codes.",
      },
      {
        step: "2",
        title: "Paste Payload or Content",
        description: "Paste your raw JSON code or enter the destination URL / Wi-Fi credentials.",
      },
      {
        step: "3",
        title: "Format or Customize",
        description: "Choose indent spacing (2 or 4 spaces), minify code, or pick custom QR code styling and error correction levels.",
      },
      {
        step: "4",
        title: "Copy or Download",
        description: "Copy cleaned JSON directly or download your vector SVG / high-resolution PNG QR image.",
      },
    ],
    faqs: [
      {
        question: "Can Utilby handle large JSON files?",
        answer:
          "Yes. Utilby uses native browser JSON parsers that easily parse and format megabytes of JSON data in a few milliseconds.",
      },
      {
        question: "Are generated QR codes permanent?",
        answer:
          "Yes. Utilby creates static, standard-compliant QR codes that encode data directly into the pixel pattern. They never expire and require no external redirect servers.",
      },
    ],
  },

  calculators: {
    id: "calculators",
    slug: "calculators",
    aliases: ["calculators", "calc", "calculator-tools"],
    name: "Calculators",
    seoTitle: "Free Online Calculators – Percentage & Math Formulas | Utilby",
    seoDescription:
      "Calculate percentage values, percentage increases, percentage decreases, and retail discounts with step-by-step mathematical formulas. Free and instant.",
    h1: "Free Online Calculators",
    subtitle:
      "Fast, accurate mathematical and financial percentage calculators with transparent step-by-step working and zero advertising distraction.",
    highlightStats: [
      "3-in-1 Percentage Mode",
      "Step-by-Step Formula Breakdown",
      "Instant Real-Time Math",
      "AdSense Policy Compliant Layout",
    ],
    whyChooseHeading: "Clear, Accurate Mathematics Without the Clutter",
    whyChoosePoints: [
      {
        title: "Step-by-Step Mathematical Transparency",
        description:
          "Unlike black-box calculators, Utilby shows the exact mathematical formula used so students and professionals can verify the working.",
      },
      {
        title: "Instant Live Computation",
        description:
          "Values update on every keystroke. Compare percentage changes, discounts, and ratio differences in real time.",
      },
      {
        title: "Clean, Accessible Interface",
        description:
          "Large high-contrast numbers, keyboard navigable inputs, and clean copy buttons make calculations effortless on mobile and desktop.",
      },
    ],
    howToSteps: [
      {
        step: "1",
        title: "Choose Calculation Type",
        description: "Pick between 'What is X% of Y?', 'X is what % of Y?', or 'Percentage Change / Discount'.",
      },
      {
        step: "2",
        title: "Enter Values",
        description: "Input your starting numbers into the designated fields.",
      },
      {
        step: "3",
        title: "View Answer & Formula",
        description: "Read the computed result and inspect the step-by-step formula showing how it was calculated.",
      },
      {
        step: "4",
        title: "Copy Result",
        description: "Click the copy icon to transfer the exact figure directly to your spreadsheet or report.",
      },
    ],
    faqs: [
      {
        question: "How do I calculate a percentage increase?",
        answer:
          "To find percentage increase: subtract the old value from the new value, divide by the old value, and multiply by 100: ((New - Old) ÷ Old) × 100.",
      },
      {
        question: "Can I calculate retail discounts with this tool?",
        answer:
          "Yes. Our Percentage Calculator has a dedicated mode to calculate original prices, sale discounts, and total savings in seconds.",
      },
    ],
  },

  security: {
    id: "security",
    slug: "security-tools",
    aliases: ["security", "security-tools", "sec"],
    name: "Security Tools",
    seoTitle: "Free Online Security Tools – Cryptographic Password Generator | Utilby",
    seoDescription:
      "Generate strong, unhackable passwords client-side with hardware-level CSPRNG entropy. Customizable length, symbols, numbers, and complete offline privacy.",
    h1: "Free Online Security Tools",
    subtitle:
      "Hardware-level cryptographic password generation and digital privacy utilities that never transmit credentials over any network.",
    highlightStats: [
      "Hardware CSPRNG (window.crypto)",
      "High-Entropy Random Generation",
      "Zero Network Transmission",
      "Customizable Character Sets",
    ],
    whyChooseHeading: "Why True Client-Side Cryptography Matters",
    whyChoosePoints: [
      {
        title: "Hardware-Level Entropy",
        description:
          "Utilby uses your operating system's cryptographic random number generator (CSPRNG via window.crypto) instead of predictable Math.random().",
      },
      {
        title: "Zero Credential Transmission",
        description:
          "Your generated passwords exist solely in temporary RAM. No server, database, or analytics script ever sees, logs, or stores your passwords.",
      },
      {
        title: "Audit-Ready Security Standards",
        description:
          "Configure passwords up to 64 characters with numbers, lowercase, uppercase, and special characters suitable for banking, servers, and password managers.",
      },
    ],
    howToSteps: [
      {
        step: "1",
        title: "Set Password Length",
        description: "Use the slider to select a length from 8 to 64 characters (16+ recommended).",
      },
      {
        step: "2",
        title: "Choose Character Rules",
        description: "Toggle numbers (0-9) and special symbols (!@#$%^&*) to meet your service requirements.",
      },
      {
        step: "3",
        title: "Generate & Check Entropy",
        description: "Click Generate to synthesize a new high-entropy password and inspect the strength meter.",
      },
      {
        step: "4",
        title: "Copy Securely",
        description: "Click Copy to insert the password directly into your password manager or account setup form.",
      },
    ],
    faqs: [
      {
        question: "Is it safe to generate passwords on a website?",
        answer:
          "Most websites generate passwords on their backend servers, which creates a huge security risk. Utilby is different: our code runs 100% inside your browser via window.crypto. No password ever travels across the internet.",
      },
      {
        question: "What makes a password cryptographically secure?",
        answer:
          "A secure password requires true unpredictability (high entropy) and sufficient length. A 16+ character password with symbols and numbers would take modern supercomputers trillions of years to crack.",
      },
    ],
  },
};

/** Helper to find category landing data by slug or id */
/** Replaces `{count}` with the live number of ready tools so landing copy never goes stale. */
function withLiveCounts(data: CategoryLandingData): CategoryLandingData {
  const count = String(TOOLS.filter((t) => t.category === data.id && t.isReady).length);
  const fill = (s: string) => s.replace(/\{count\}/g, count);
  return {
    ...data,
    seoTitle: fill(data.seoTitle),
    seoDescription: fill(data.seoDescription),
    subtitle: fill(data.subtitle),
    highlightStats: data.highlightStats.map(fill),
  };
}

export function getCategoryLandingData(slugOrId: string): CategoryLandingData | undefined {
  const norm = slugOrId.toLowerCase().trim();
  for (const key of Object.keys(CATEGORY_LANDING_PAGES) as ToolMeta["category"][]) {
    const data = CATEGORY_LANDING_PAGES[key];
    if (data.id === norm || data.slug === norm || data.aliases.includes(norm)) {
      return withLiveCounts(data);
    }
  }
  return undefined;
}

export const ALL_CATEGORY_SLUGS = [
  "pdf-tools",
  "image-tools",
  "text-tools",
  "developer-tools",
  "calculators",
  "security-tools",
  // Aliases for seamless direct navigation
  "pdf",
  "image",
  "text",
  "developer",
  "security",
];
