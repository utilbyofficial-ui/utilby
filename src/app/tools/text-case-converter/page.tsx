import type { Metadata } from "next";
import { ToolLayout } from "@/components/shared/ToolLayout";
import { TextCaseConverterTool } from "@/modules/text-case/TextCaseConverterTool";

export const metadata: Metadata = {
  title: "Text Case Converter – Convert Uppercase, Lowercase & Title Case Online | Utilby",
  description:
    "Instantly convert text to UPPERCASE, lowercase, Title Case, Sentence case, and Capitalized words. Clean spaces and remove duplicate lines for free.",
  keywords: [
    "text case converter",
    "uppercase converter",
    "lowercase converter",
    "title case generator",
    "sentence case converter",
    "remove duplicate lines",
    "clean spaces text",
  ],
  alternates: {
    canonical: "/tools/text-case-converter",
  },
};

export default function TextCaseConverterPage() {
  const howToSteps = [
    {
      step: "1",
      title: "Paste or Type Text",
      description:
        "Input your text into the text area. You can convert short titles or multiple paragraphs.",
    },
    {
      step: "2",
      title: "Select Case Transformation",
      description:
        "Click on UPPERCASE, lowercase, Title Case, Sentence case, or Capitalize Words to transform your text instantaneously.",
    },
    {
      step: "3",
      title: "Clean Formatting (Optional)",
      description:
        "Click 'Clean Spaces' to eliminate redundant spaces/tabs, or 'Remove Duplicate Lines' to strip duplicate entries in lists.",
    },
    {
      step: "4",
      title: "Copy Result",
      description:
        "Click 'Copy' to copy the converted text to your clipboard with zero formatting loss.",
    },
  ];

  const technicalDetails = {
    title: "Case Conversion Conventions & Typography Rules",
    content: (
      <>
        <p>
          Different publishing standards dictate specific letter casing formats. Here is an overview of the typographic rules implemented in this tool:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>UPPERCASE:</strong> All characters converted to capital letters. Often used for legal acronyms, headlines, and callout banners.
          </li>
          <li>
            <strong>lowercase:</strong> All letters converted to small characters. Frequently required for URLs, database keys, and email addresses.
          </li>
          <li>
            <strong>Title Case:</strong> Capitalizes major words while keeping minor prepositions, articles, and conjunctions (e.g., <em>a, an, the, of, in, for</em>) in lowercase unless they appear at the start of the title.
          </li>
          <li>
            <strong>Sentence case:</strong> Capitalizes only the first letter of each sentence following periods, exclamation marks, or question marks.
          </li>
        </ul>
      </>
    ),
  };

  const faqs = [
    {
      question: "What is Title Case and when should I use it?",
      answer:
        "Title Case capitalizes the first letter of principal words while keeping short connecting words (articles, short prepositions, conjunctions) in lowercase. It is the gold standard for book titles, blog headlines, essays, and movie titles.",
    },
    {
      question: "How does the duplicate line remover work?",
      answer:
        "It scans your text line-by-line, preserves the first instance of each line, and removes subsequent identical lines while preserving the original sequence. Ideal for cleaning email lists, keyword sets, or code arrays.",
    },
    {
      question: "Does this tool support non-English letters with accents (e.g., é, ü, ñ)?",
      answer:
        "Yes! Our case converter uses modern JavaScript Unicode case-mapping (`String.prototype.toUpperCase` and `toLowerCase`), properly maintaining accent marks and special Latin characters.",
    },
  ];

  return (
    <ToolLayout
      toolId="text-case-converter"
      title="Online Text Case Converter"
      subtitle="Transform your text into UPPERCASE, lowercase, Title Case, Sentence case, clean extra spaces, and remove duplicate lines instantly."
      category="Text Tools"
      categorySlug="text"
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={faqs}
    >
      <TextCaseConverterTool />
    </ToolLayout>
  );
}
