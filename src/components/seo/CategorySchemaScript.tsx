import React from "react";
import { CategoryLandingData } from "@/lib/category-landing";
import { ToolMeta } from "@/lib/tools-registry";

interface CategorySchemaScriptProps {
  data: CategoryLandingData;
  tools: ToolMeta[];
}

export function CategorySchemaScript({ data, tools }: CategorySchemaScriptProps) {
  const readyTools = tools.filter((t) => t.isReady);
  const canonicalUrl = `https://utilby.com/${data.slug}`;

  // 1. CollectionPage with ItemList for Sitelinks & Carousel
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: data.seoTitle,
    description: data.seoDescription,
    url: canonicalUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: readyTools.length,
      itemListElement: readyTools.map((t, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: t.name,
        url: `https://utilby.com/tools/${t.slug}`,
        description: t.shortDescription,
      })),
    },
  };

  // 2. BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://utilby.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: data.name,
        item: canonicalUrl,
      },
    ],
  };

  // 3. FAQPage Schema
  const faqSchema =
    data.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: data.faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: f.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </>
  );
}
