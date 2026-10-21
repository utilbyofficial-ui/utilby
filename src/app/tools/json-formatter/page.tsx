import type { Metadata } from "next";
import { ToolLayout } from "@/components/shared/ToolLayout";
import { JsonFormatterTool } from "@/modules/json-formatter/JsonFormatterTool";

export const metadata: Metadata = {
  title: "Online JSON Formatter, Beautifier & Validator | Utilby",
  description:
    "Clean, format, indent, minify, and validate JSON data online with pinpoint syntax error detection. 100% private client-side JSON tool.",
  keywords: [
    "json formatter",
    "json validator",
    "json beautifier",
    "format json online",
    "minify json",
    "validate json syntax",
    "json parser",
  ],
  alternates: {
    canonical: "/tools/json-formatter",
  },
};

export default function JsonFormatterPage() {
  const howToSteps = [
    {
      step: "1",
      title: "Enter JSON Data",
      description:
        "Paste unformatted, compact, or messy JSON into the editor, or click 'Sample' to test with an example payload.",
    },
    {
      step: "2",
      title: "Choose Format or Minify",
      description:
        "Click 'Beautify / Format' with 2 or 4 space indentation for human readability, or click 'Minify' to remove all unnecessary whitespace.",
    },
    {
      step: "3",
      title: "Validate & Locate Errors",
      description:
        "If there are syntax mistakes (e.g. trailing commas or missing quotes), the tool will pinpoint the exact line and column location immediately.",
    },
    {
      step: "4",
      title: "Copy or Download",
      description:
        "Use the one-click 'Copy' button or download the formatted data as a `.json` file directly to your computer.",
    },
  ];

  const technicalDetails = {
    title: "JSON Specification, Standards & Error Detection",
    content: (
      <>
        <p>
          JSON (JavaScript Object Notation, RFC 8259) is a standardized, lightweight text-based data interchange format. Proper JSON requires strict adherence to syntax rules, such as double-quoted keys, specific string escape sequences, and no trailing commas after the last item in objects or arrays.
        </p>
        <p>
          <strong>Pinpoint Syntax Parsing:</strong> When invalid JSON is parsed, our engine intercepts the native parser token stream, parses the exception stack, and maps the exact byte index into human-readable line and column numbers.
        </p>
        <p>
          <strong>Security Note:</strong> Sensitive API keys, payloads, or production database exports are completely safe because parsing happens locally in your browser with zero remote transmission.
        </p>
      </>
    ),
  };

  const faqs = [
    {
      question: "Why does my JSON show a syntax error?",
      answer:
        "Common reasons include: trailing commas after the last key or array element, using single quotes (') instead of double quotes (\"), unescaped newlines in strings, or missing closing braces/brackets.",
    },
    {
      question: "Is it safe to paste confidential API keys or production database JSON here?",
      answer:
        "Yes, absolutely. Unlike many online formatters that send your payloads over the wire to their server logs, Utilby executes 100% in your local web browser. Inspect your browser's Network tab to confirm zero outgoing requests.",
    },
    {
      question: "What is the benefit of minifying JSON?",
      answer:
        "Minification removes tabs, line breaks, and whitespace, reducing the raw payload size by 20% to 50%. This decreases network bandwidth consumption and improves API response times in production systems.",
    },
    {
      question: "Can this tool handle large JSON files (10MB+)?",
      answer:
        "Yes, our engine leverages modern browser V8 memory allocation. Files up to 20MB can typically be formatted smoothly depending on your system RAM.",
    },
  ];

  return (
    <ToolLayout
      toolId="json-formatter"
      title="Online JSON Formatter & Validator"
      subtitle="Format, validate, beautify, and minify your JSON data with instant syntax error detection and complete client-side security."
      category="Developer Tools"
      categorySlug="developer"
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={faqs}
    >
      <JsonFormatterTool />
    </ToolLayout>
  );
}
