import type { Metadata } from "next";
import { ToolLayout } from "@/components/shared/ToolLayout";
import { CsvJsonConverterTool } from "@/modules/csv-json-converter/CsvJsonConverterTool";

export const metadata: Metadata = {
  title: "CSV to JSON Converter – Convert JSON to CSV Online | Utilby",
  description:
    "Convert CSV files into JSON or JSON arrays into CSV. Detect separators, handle quoted cells, preview, copy, and download privately in your browser.",
  keywords: [
    "CSV to JSON converter",
    "JSON to CSV converter",
    "convert CSV online",
    "spreadsheet to JSON",
    "CSV parser",
    "JSON spreadsheet converter",
  ],
  alternates: { canonical: "/tools/csv-json-converter" },
  openGraph: {
    title: "CSV ↔ JSON Converter | Utilby",
    description: "Convert between CSV and JSON with local previews and downloads. Your data stays in your browser.",
    url: "https://utilby.com/tools/csv-json-converter",
    type: "website",
    images: [{ url: "https://utilby.com/og/tools/csv-json-converter.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["https://utilby.com/og/tools/csv-json-converter.png"] },
};

export default function CsvJsonConverterPage() {
  const howToSteps = [
    { step: "1", title: "Choose a direction", description: "Pick CSV → JSON or JSON → CSV, then paste your data or choose a local file." },
    { step: "2", title: "Set CSV options", description: "For CSV input, choose a separator or let the tool detect it. Tell the converter whether the first row has column names." },
    { step: "3", title: "Preview the conversion", description: "Select Convert to check the result. Malformed quotes and unsupported JSON row shapes show a clear error." },
    { step: "4", title: "Copy or save", description: "Copy the output or download a .json or .csv file. Your original file is left unchanged." },
  ];

  const technicalDetails = {
    title: "Reliable CSV and JSON conversion in your browser",
    content: (
      <>
        <p>CSV parsing supports comma, semicolon, tab, and pipe separators, quoted cells, escaped quotes, and line breaks inside quoted cells. Separator detection ignores delimiters inside quoted values.</p>
        <p>CSV values remain text so identifiers such as postal codes and values with leading zeroes are preserved. JSON-to-CSV accepts arrays of objects or arrays; nested values are encoded as JSON text inside a CSV cell.</p>
        <p>Files are read and converted on your device. The tool accepts inputs up to 5 MB to keep conversion responsive.</p>
      </>
    ),
  };

  const faqs = [
    { question: "Does the tool upload my file?", answer: "No. File reading and conversion happen in your browser. Your CSV and JSON content is not sent to a server." },
    { question: "Can CSV values contain commas or line breaks?", answer: "Yes. Put those values inside double quotes. A quote inside a quoted value is written twice, following the standard CSV convention." },
    { question: "Will it turn values into numbers or dates?", answer: "No. CSV cells stay as text, which helps preserve leading zeroes, dates, and long identifiers exactly as written." },
    { question: "What JSON shape can I convert to CSV?", answer: "Use an array of objects, such as [{ name: 'Ari' }], or an array of arrays. All rows must use the same shape." },
    { question: "Why does automatic separator detection choose the wrong one?", answer: "If a file uses an unusual format or has very few columns, select its separator manually above the input." },
  ];

  return (
    <ToolLayout
      toolId="csv-json-converter"
      title="CSV ↔ JSON Converter"
      subtitle="Convert spreadsheet rows into JSON or turn JSON data into CSV. Preview, copy, and save your result privately in your browser."
      category="Developer Tools"
      categorySlug="developer"
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={faqs}
    >
      <CsvJsonConverterTool />
    </ToolLayout>
  );
}
