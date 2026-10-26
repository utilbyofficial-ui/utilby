import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, FileImage, FileText, Image as ImageIcon, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Help & Guides – Choose the Right Utilby Tool",
  description:
    "Simple guides to Utilby PDF and image tools, file limits, local processing, and reviewing your results before download.",
  alternates: { canonical: "/help" },
};

const guides = [
  {
    title: "Edit and review a PDF",
    description: "Change supported selectable text, add content, sign, draw, or compare your edits with the original page.",
    href: "/tools/pdf-editor",
    label: "Open PDF Editor",
    icon: FileText,
    tone: "bg-pdf-soft",
  },
  {
    title: "Make a PDF smaller",
    description: "Choose a compression level, compare the file sizes, and check the downloaded PDF before sharing it.",
    href: "/tools/pdf-compressor",
    label: "Open PDF Compressor",
    icon: BookOpen,
    tone: "bg-pdf-soft",
  },
  {
    title: "Turn images into a PDF",
    description: "Put JPG, PNG, or WebP images into a PDF, then review the page order and orientation.",
    href: "/tools/jpg-to-pdf",
    label: "Open JPG to PDF",
    icon: FileImage,
    tone: "bg-img-soft",
  },
  {
    title: "Compress a batch of photos",
    description: "Adjust image quality and format, preview the result, then download images individually or as a ZIP.",
    href: "/tools/image-compressor",
    label: "Open Image Compressor",
    icon: ImageIcon,
    tone: "bg-img-soft",
  },
];

const limits = [
  { tool: "PDF Editor", limit: "Up to 100 MB and 500 pages", href: "/tools/pdf-editor" },
  { tool: "PDF Compressor", limit: "Up to 100 MB", href: "/tools/pdf-compressor" },
  { tool: "Image Compressor", limit: "Up to 50 MB per image; 20 files and 100 MB per batch", href: "/tools/image-compressor" },
];

export default function HelpPage() {
  return (
    <div className="pb-16">
      <section className="bg-sun-soft">
        <div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
            <Link href="/" className="hover:text-ink hover:underline">Home</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span className="font-semibold text-ink">Help &amp; Guides</span>
          </nav>
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-soft">
            <BookOpen className="h-4 w-4 text-amber-600" /> Simple steps, clear limits
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Help &amp; Guides
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-700 sm:text-lg">
            Find the right tool, understand what it changes, and check file limits before you begin.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <section aria-labelledby="guides-heading" className="pt-12 sm:pt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="guides-heading" className="font-display text-3xl font-bold tracking-tight text-ink">Start with a task</h2>
              <p className="mt-2 text-slate-600">Open the tool and follow the steps on its page.</p>
            </div>
            <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:underline">
              Browse all tools <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {guides.map(({ title, description, href, label, icon: Icon, tone }) => (
              <Link key={href} href={href} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lift sm:p-6">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
                  <Icon className="h-6 w-6 text-ink" />
                </span>
                <h3 className="mt-4 font-display text-xl font-bold text-ink">{title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-relaxed text-slate-600">{description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                  {label} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="limits-heading" className="mt-14 rounded-[28px] bg-slate-50 p-5 sm:mt-16 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-soft">
              <FileText className="h-5 w-5 text-ink" />
            </span>
            <div>
              <h2 id="limits-heading" className="font-display text-2xl font-bold text-ink">File limits at a glance</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">Limits differ between tools. Your device’s available memory can also affect large or complex files.</p>
            </div>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {limits.map((item, index) => (
              <div key={item.tool} className={`grid gap-1 px-4 py-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-center sm:gap-4 sm:px-5 ${index ? "border-t border-slate-100" : ""}`}>
                <Link href={item.href} className="font-semibold text-ink hover:underline">{item.tool}</Link>
                <span className="text-sm text-slate-600">{item.limit}</span>
                <Link href={item.href} aria-label={`Open ${item.tool}`} className="hidden items-center justify-end text-slate-500 hover:text-ink sm:inline-flex">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">Other tools show their supported types and limits in the upload area before you select a file.</p>
        </section>

        <section aria-labelledby="pdf-editing-heading" className="mt-8 rounded-[28px] border border-amber-200 bg-amber-50 p-5 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white">
              <ShieldCheck className="h-5 w-5 text-amber-700" />
            </span>
            <div>
              <h2 id="pdf-editing-heading" className="font-display text-xl font-bold text-ink sm:text-2xl">A note about PDF editing and Whiteout</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                The PDF Editor can change supported selectable text and add or move content. Scanned text is part of an image and may not be editable. Whiteout covers an area and attempts to remove selectable text beneath it, but it cannot guarantee that every image or PDF layer is removed. Do not use it as secure redaction for confidential information.
              </p>
              <Link href="/tools/pdf-editor" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:underline">
                Read the PDF Editor details <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-12 flex flex-col justify-between gap-4 rounded-3xl bg-ink p-6 text-white sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="font-display text-2xl font-bold">Still need help?</h2>
            <p className="mt-1 text-sm text-slate-300">Send a question or tell us what did not work as expected.</p>
          </div>
          <Link href="/contact" className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-sun">
            Contact Utilby <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
