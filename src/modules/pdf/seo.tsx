import type { Metadata } from "next";
import type { PdfWorkspaceMode } from "./PdfWorkspace";

export interface PdfToolConfig {
  slug: string;
  mode: PdfWorkspaceMode;
  title: string;
  metaTitle: string;
  metaDescription: string;
  subtitle: string;
  keywords: string[];
  howToSteps: { step: string; title: string; description: string }[];
  faqs: { question: string; answer: string }[];
}

const PRIVACY_FAQ = {
  question: "Are my PDF files uploaded to a server?",
  answer:
    "No. Every PDF is opened and processed inside your own browser using JavaScript. Your documents are never uploaded, stored, or seen by anyone — which makes it safe for contracts, bank statements, and other confidential files.",
};

const FREE_FAQ = {
  question: "Is it free? Are there limits or watermarks?",
  answer:
    "It's completely free with no sign-up, no watermark, and no daily limits. Because files are processed on your device, the only limit is your device's memory — files of a few hundred pages work fine on most computers.",
};

const PASSWORD_FAQ = {
  question: "Can I use password-protected PDFs?",
  answer:
    "Not yet. Encrypted PDFs need the password removed first. Open the file in your PDF reader, enter the password, and use Print → Save as PDF to create an unlocked copy.",
};

export const PDF_TOOLS: Record<string, PdfToolConfig> = {
  "pdf-merger": {
    slug: "pdf-merger",
    mode: "merge",
    title: "Merge PDF",
    metaTitle: "Merge PDF – Combine PDF Files Online Free | Utilby",
    metaDescription:
      "Combine multiple PDF files into one in seconds. Drag pages to reorder, rotate or delete them, add images, then download a single merged PDF. No upload — 100% private.",
    subtitle:
      "Combine multiple PDFs and images into one document. Reorder, rotate, or remove pages before merging — all inside your browser, nothing is uploaded.",
    keywords: ["merge pdf", "combine pdf", "pdf merger", "join pdf files", "merge pdf online free", "combine pdf files into one"],
    howToSteps: [
      { step: "1", title: "Add Your PDFs", description: "Drop two or more PDF files into the box, or click to browse. You can also add JPG or PNG images — each becomes a page." },
      { step: "2", title: "Arrange the Pages", description: "Every page appears as a thumbnail, color-coded by file. Drag pages (or use the arrows) to put them in the order you want." },
      { step: "3", title: "Tidy Up (Optional)", description: "Rotate sideways pages, delete pages you don't need, duplicate pages, or insert blank pages. Undo any change with Ctrl+Z." },
      { step: "4", title: "Download", description: "Name your file and click Download PDF. The merged document is created on your device in seconds." },
    ],
    faqs: [
      PRIVACY_FAQ,
      { question: "Can I merge only certain pages from each PDF?", answer: "Yes. After adding the files, delete the pages you don't want or select specific pages and use Split / Extract → Selected pages to create a PDF containing only those pages." },
      { question: "Will merging reduce the quality of my PDF?", answer: "No. Pages are copied directly into the new document without re-rendering, so text stays selectable and searchable, and images keep their original quality." },
      { question: "Are links, bookmarks and form fields kept?", answer: "Page content, text, and images are preserved exactly. Interactive extras such as the original bookmarks outline and fillable form fields may not carry over into the merged file." },
      FREE_FAQ,
      PASSWORD_FAQ,
    ],
  },
  "split-pdf": {
    slug: "split-pdf",
    mode: "split",
    title: "Split PDF",
    metaTitle: "Split PDF – Separate PDF Pages Online Free | Utilby",
    metaDescription:
      "Split a PDF into multiple files by page ranges, every N pages, or one file per page. Preview every page before splitting. Free, no upload, works in your browser.",
    subtitle:
      "Split one PDF into several files — by custom page ranges, every N pages, or every page on its own. Preview pages first, then download as PDF or ZIP.",
    keywords: ["split pdf", "split pdf online", "separate pdf pages", "pdf splitter", "split pdf by pages", "cut pdf"],
    howToSteps: [
      { step: "1", title: "Open Your PDF", description: "Drop the PDF you want to split into the box. All pages appear as numbered thumbnails." },
      { step: "2", title: "Choose a Split Method", description: "Custom ranges (e.g. 1-3, 4-8), every N pages, every page separately, or only the pages you select." },
      { step: "3", title: "Check the Preview", description: "The panel shows exactly which pages go into each new file before you split." },
      { step: "4", title: "Download", description: "One output file downloads as a PDF; multiple files are bundled into a single ZIP." },
    ],
    faqs: [
      PRIVACY_FAQ,
      { question: "How do I write page ranges?", answer: "Separate ranges with commas. “1-3, 4-6, 7” creates three PDFs. “5-” means page 5 to the end, and “-3” means pages 1 to 3. Page numbers match the numbers shown under the thumbnails." },
      { question: "Can I split a PDF into single pages?", answer: "Yes — choose “Every page separately”. Each page becomes its own PDF, and all of them download together in a ZIP file." },
      { question: "Does splitting change the original file?", answer: "No. Your original PDF is never modified. New files are created from a copy in your browser's memory." },
      FREE_FAQ,
    ],
  },
  "organize-pdf": {
    slug: "organize-pdf",
    mode: "organize",
    title: "Organize PDF Pages",
    metaTitle: "Organize PDF – Reorder, Rotate, Delete & Add Pages | Utilby",
    metaDescription:
      "Rearrange PDF pages with drag and drop. Rotate, delete, duplicate, insert blank pages, reverse order, and undo changes. Free online PDF organizer — no upload.",
    subtitle:
      "Drag and drop to reorder pages, rotate, duplicate, delete, or insert blank pages — with full undo. Your PDF never leaves your device.",
    keywords: ["organize pdf", "reorder pdf pages", "rearrange pdf pages", "sort pdf pages", "pdf page organizer", "move pdf pages"],
    howToSteps: [
      { step: "1", title: "Open Your PDF", description: "Drop one or more PDFs into the box. Each page appears as a thumbnail." },
      { step: "2", title: "Reorder Pages", description: "Drag thumbnails to a new position. Select several pages (Shift+click for a range) and drag them together." },
      { step: "3", title: "Edit the Page List", description: "Rotate, duplicate, delete, insert blank pages, or reverse the whole document. Ctrl+Z undoes any step." },
      { step: "4", title: "Save", description: "Click Download PDF to save the reorganized document." },
    ],
    faqs: [
      PRIVACY_FAQ,
      { question: "How do I move several pages at once?", answer: "Click the first page, Shift+click the last page to select the range (or click pages one by one), then drag any selected page — the whole selection moves together." },
      { question: "Can I undo a mistake?", answer: "Yes. Use the Undo and Redo buttons in the toolbar, or press Ctrl+Z / Ctrl+Shift+Z (Cmd on Mac). Up to 50 steps are remembered." },
      { question: "Does it work on phones?", answer: "Yes. On touch screens use the arrow buttons under each page to move it left or right, and tap pages to select them." },
      FREE_FAQ,
    ],
  },
  "rotate-pdf": {
    slug: "rotate-pdf",
    mode: "rotate",
    title: "Rotate PDF",
    metaTitle: "Rotate PDF – Rotate PDF Pages Permanently Online | Utilby",
    metaDescription:
      "Rotate PDF pages 90°, 180° or 270° and save permanently. Rotate single pages or all pages at once, with live thumbnails. Free, private, no upload.",
    subtitle: "Fix sideways or upside-down pages. Rotate one page, a selection, or the whole document, then save the corrected PDF permanently.",
    keywords: ["rotate pdf", "rotate pdf pages", "rotate pdf online", "turn pdf pages", "fix upside down pdf", "rotate pdf permanently"],
    howToSteps: [
      { step: "1", title: "Open Your PDF", description: "Drop your PDF into the box to see every page as a thumbnail." },
      { step: "2", title: "Rotate Pages", description: "Click the rotate icon under any page, or select pages and use Rotate in the toolbar. With nothing selected, it rotates all pages." },
      { step: "3", title: "Save", description: "Click Download PDF. The rotation is saved into the file, so it opens correctly everywhere." },
    ],
    faqs: [
      PRIVACY_FAQ,
      { question: "Is the rotation permanent?", answer: "Yes. The new orientation is written into the PDF, so it stays rotated in every PDF reader, browser, and printer." },
      { question: "Does rotating reduce quality?", answer: "No. Rotation only changes the page's orientation setting — the text and images themselves are not re-compressed." },
      FREE_FAQ,
    ],
  },
  "delete-pdf-pages": {
    slug: "delete-pdf-pages",
    mode: "delete",
    title: "Delete PDF Pages",
    metaTitle: "Delete PDF Pages – Remove Pages from PDF Online Free | Utilby",
    metaDescription:
      "Remove unwanted pages from a PDF. Select pages visually, delete them, and download a clean PDF. Undo anytime. Free, no upload, works in your browser.",
    subtitle: "Remove blank, duplicate, or unwanted pages from your PDF. Select them visually, delete, and download the cleaned-up document.",
    keywords: ["delete pdf pages", "remove pages from pdf", "pdf page remover", "delete page from pdf", "remove blank pages pdf"],
    howToSteps: [
      { step: "1", title: "Open Your PDF", description: "Drop your PDF into the box — all pages appear as thumbnails." },
      { step: "2", title: "Select Pages to Remove", description: "Click the pages you want to delete (Shift+click to select a range)." },
      { step: "3", title: "Delete", description: "Press the Delete key or the Delete button. Use Undo if you remove the wrong page." },
      { step: "4", title: "Download", description: "Click Download PDF to save the document without those pages." },
    ],
    faqs: [
      PRIVACY_FAQ,
      { question: "Can I recover a page I deleted by mistake?", answer: "Yes, while you're still on the page: press Undo (Ctrl+Z). Your original file is never modified, so you can also simply open it again." },
      { question: "Is deleting pages the same as extracting?", answer: "They're opposites. Delete removes the pages you select; Extract keeps only the pages you select. Both are available in this tool." },
      FREE_FAQ,
    ],
  },
  "extract-pdf-pages": {
    slug: "extract-pdf-pages",
    mode: "extract",
    title: "Extract PDF Pages",
    metaTitle: "Extract PDF Pages – Save Selected Pages as New PDF | Utilby",
    metaDescription:
      "Extract specific pages from a PDF into a new file. Pick pages visually or type ranges like 2-5, 9. Free, private, no upload required.",
    subtitle: "Pick exactly the pages you need and save them as a new PDF — click to select, or type page ranges. Nothing is uploaded.",
    keywords: ["extract pdf pages", "extract pages from pdf", "save pdf pages", "pdf page extractor", "select pages from pdf"],
    howToSteps: [
      { step: "1", title: "Open Your PDF", description: "Drop your PDF into the box to see all its pages." },
      { step: "2", title: "Select Pages", description: "Click the pages you want to keep. Shift+click selects a range; Ctrl+A selects all." },
      { step: "3", title: "Extract", description: "With “Selected pages → one PDF” chosen, click Extract PDF. Or use Custom ranges to create several files at once." },
    ],
    faqs: [
      PRIVACY_FAQ,
      { question: "Can I extract pages into separate files?", answer: "Yes. Choose “Custom ranges” and type for example “1-2, 5, 8-10” to get three PDFs, or “Every page separately” for one file per page." },
      { question: "Can I change the page order of the extracted file?", answer: "Yes. Drag the pages into the order you want before extracting — the new PDF follows the order shown on screen." },
      FREE_FAQ,
    ],
  },
  "jpg-to-pdf": {
    slug: "jpg-to-pdf",
    mode: "images",
    title: "JPG to PDF",
    metaTitle: "JPG to PDF – Convert Images to PDF Online Free | Utilby",
    metaDescription:
      "Convert JPG, PNG, WebP and other images into a PDF. Reorder and rotate images, choose A4, Letter or original size, and download. Free, private, no upload.",
    subtitle: "Turn photos, scans, and screenshots into a single PDF. Reorder and rotate images, pick a page size, and download — all on your device.",
    keywords: ["jpg to pdf", "image to pdf", "png to pdf", "convert jpg to pdf", "photo to pdf", "pictures to pdf"],
    howToSteps: [
      { step: "1", title: "Add Images", description: "Drop JPG, PNG, WebP, GIF or BMP images into the box. Each image becomes one page. You can mix in existing PDFs too." },
      { step: "2", title: "Arrange & Rotate", description: "Drag images into the right order and rotate any that are sideways. Phone photos are auto-rotated using their EXIF data." },
      { step: "3", title: "Choose Page Size", description: "Pick A4 or US Letter with a neat margin, or “Same as image” for edge-to-edge pages." },
      { step: "4", title: "Download", description: "Click Download PDF to create your document instantly." },
    ],
    faqs: [
      PRIVACY_FAQ,
      { question: "Will my image quality be reduced?", answer: "No. JPG and PNG images are placed in the PDF exactly as they are, without re-compression. Other formats (WebP, GIF, BMP) are converted losslessly to PNG first." },
      { question: "Which page size should I choose?", answer: "Use A4 (most of the world) or US Letter (USA/Canada) for documents you'll print or submit. Choose “Same as image” for photo books or screenshots where you want no white border." },
      { question: "Can I convert HEIC photos from iPhone?", answer: "Most browsers can't read HEIC yet. On iPhone, set Settings → Camera → Formats → Most Compatible, or share the photo as JPG first." },
      FREE_FAQ,
    ],
  },
};

export function pdfToolMetadata(slug: string): Metadata {
  const t = PDF_TOOLS[slug];
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    keywords: t.keywords,
    alternates: { canonical: `/tools/${t.slug}` },
    openGraph: {
      title: t.metaTitle,
      description: t.metaDescription,
      url: `https://utilby.com/tools/${t.slug}`,
      type: "website",
    },
  };
}
