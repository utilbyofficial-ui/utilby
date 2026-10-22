import { ToolLayout } from "@/components/shared/ToolLayout";
import { PdfWorkspace } from "./PdfWorkspace";
import { PDF_TOOLS } from "./seo";

const technicalDetails = {
  title: "How Utilby Processes PDFs Privately",
  content: (
    <>
      <p>
        Most online PDF tools upload your document to their servers. Utilby doesn&apos;t. Pages are read and rebuilt
        directly in your browser using <strong>pdf-lib</strong>, and thumbnails are drawn with Mozilla&apos;s
        <strong> PDF.js</strong> — the same engine that powers Firefox&apos;s PDF viewer.
      </p>
      <p>
        <strong>Lossless page copying:</strong> When you merge, split, reorder, or rotate, each page is copied as-is
        into the new document. Text stays selectable and searchable, fonts stay embedded, and images keep their original
        resolution.
      </p>
      <p>
        <strong>Works offline:</strong> After the page has loaded, you can disconnect from the internet and the tool keeps
        working — proof that nothing is being sent anywhere.
      </p>
    </>
  ),
};

export function PdfToolPage({ slug }: { slug: string }) {
  const t = PDF_TOOLS[slug];
  return (
    <ToolLayout
      toolId={t.slug}
      title={t.title}
      subtitle={t.subtitle}
      category="PDF Tools"
      categorySlug="pdf"
      howToSteps={t.howToSteps}
      technicalDetails={technicalDetails}
      faqs={t.faqs}
    >
      <PdfWorkspace mode={t.mode} />
    </ToolLayout>
  );
}
