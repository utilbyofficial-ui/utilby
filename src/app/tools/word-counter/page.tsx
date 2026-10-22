import type { Metadata } from "next";
import { ToolLayout } from "@/components/shared/ToolLayout";
import { WordCounterTool } from "@/modules/word-counter/WordCounterTool";

export const metadata: Metadata = {
  title: "Word Counter – Count Words, Characters & Reading Time Online | Utilby",
  description:
    "Accurately count words, characters, sentences, paragraphs, reading time, and keyword density in real-time. Free client-side text analyzer.",
  keywords: [
    "word counter",
    "character counter",
    "word count tool",
    "reading time calculator",
    "count characters online",
    "sentence counter",
  ],
  alternates: {
    canonical: "/tools/word-counter",
  },
};

export default function WordCounterPage() {
  const howToSteps = [
    {
      step: "1",
      title: "Paste or Type Text",
      description:
        "Enter your manuscript, essay, article, or social media caption into the text box above, or click 'Paste Text' to insert from your clipboard.",
    },
    {
      step: "2",
      title: "Review Instant Statistics",
      description:
        "The counter updates on every keystroke. Instantly observe total words, characters (with and without whitespace), sentences, and paragraphs.",
    },
    {
      step: "3",
      title: "Inspect Reading Time & Keywords",
      description:
        "Check estimated reading time (based on a standard 200 wpm) and review keyword frequency density to optimize for readability and SEO.",
    },
  ];

  const technicalDetails = {
    title: "Understanding Text Metrics & Counting Algorithms",
    content: (
      <>
        <p>
          Our word counter uses an advanced Unicode-aware word boundary detection algorithm. Unlike basic counters that simply split text by space characters, our tool correctly recognizes hyphenated compound words, em-dashes, contractions (such as &quot;don&apos;t&quot;), and non-Latin character scripts.
        </p>
        <p>
          <strong>Reading Time Formula:</strong> Standard adult reading speed ranges between 200 and 250 words per minute (WPM). We use a baseline of 200 WPM:
          <br />
          <code className="text-indigo-600 dark:text-indigo-400 font-mono">
            Reading Time (Minutes) = Total Words ÷ 200
          </code>
        </p>
        <p>
          <strong>Speaking Time Formula:</strong> Normal speaking pace for presentations, podcasts, and speeches averages 130 words per minute:
          <br />
          <code className="text-indigo-600 dark:text-indigo-400 font-mono">
            Speaking Time (Minutes) = Total Words ÷ 130
          </code>
        </p>
      </>
    ),
  };

  const faqs = [
    {
      question: "Is there a limit to how many words I can count?",
      answer:
        "There is no strict limit. The tool can comfortably handle over 100,000 words (full-length book manuscripts) smoothly because all processing runs directly in your browser's V8 JavaScript engine without server timeout delays.",
    },
    {
      question: "Is my text saved or sent to any server?",
      answer:
        "No. Your privacy is 100% guaranteed. All calculations are executed strictly within your local browser tab. No text, analytics payloads, or logs are transmitted to external servers.",
    },
    {
      question: "What is the difference between character count with and without spaces?",
      answer:
        "Character count with spaces counts every single byte including spaces, tabs, and line breaks. Character count without spaces strips all whitespace characters, which is often required for academic journals, translation fees, and strict publication guidelines.",
    },
    {
      question: "How does keyword density help with writing?",
      answer:
        "Keyword density shows how frequently specific words appear in your text. This helps copywriters avoid unnatural word repetition and ensures digital marketers optimize content for search engines without keyword stuffing.",
    },
  ];

  return (
    <ToolLayout
      toolId="word-counter"
      title="Online Word Counter & Character Counter"
      subtitle="Analyze your text in real-time with comprehensive word, character, sentence, paragraph counts, and estimated reading time."
      category="Text Tools"
      categorySlug="text"
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={faqs}
    >
      <WordCounterTool />
    </ToolLayout>
  );
}
