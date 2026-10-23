import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ToolsDirectory } from "@/components/tools/ToolsDirectory";
import { TOOLS, CATEGORIES } from "@/lib/tools-registry";

const ready = TOOLS.filter((t) => t.isReady);

export const metadata: Metadata = {
  title: "All Free Online Tools – PDF, Image, Text & Developer Tools | Utilby",
  description: `Browse all ${ready.length} free Utilby tools: merge, split and edit PDFs, compress and resize images, count words, format JSON, make QR codes and more. Private, in-browser, no sign-up.`,
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "All Free Online Tools | Utilby",
    description: `${ready.length} free, private tools that run in your browser — PDF, image, text and developer utilities.`,
    url: "https://utilby.com/tools",
    type: "website",
    images: [{ url: "https://utilby.com/og/default.png", width: 1200, height: 630 }],
  },
};

export default function AllToolsPage() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "All Utilby tools",
    numberOfItems: ready.length,
    itemListElement: ready.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      url: `https://utilby.com/tools/${t.slug}`,
    })),
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-8 pt-6 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <Breadcrumbs items={[{ label: "All tools" }]} />
      <div className="mb-6 mt-6">
        <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] text-ink sm:text-5xl">All tools</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-700 sm:text-lg">
          {ready.length} free tools in {CATEGORIES.length} toolboxes. Everything runs in your browser — no sign-up, no uploads.
        </p>
      </div>
      <ToolsDirectory />
    </div>
  );
}
