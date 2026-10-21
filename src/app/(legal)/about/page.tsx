import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Wrench, ShieldCheck, Zap, Globe, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | Utilby Network",
  description:
    "Learn about Utilby Network: our mission to build a fast, secure, free, and privacy-first online utility tools ecosystem for everyone.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "About Us" }]} />

      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              About Utilby Network
            </h1>
            <p className="text-sm text-slate-500">
              Modern, privacy-first web utilities built for digital professionals worldwide.
            </p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none dark:prose-invert space-y-6 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Welcome to <strong>Utilby</strong>, an international free online utility tools ecosystem. Our platform was founded with a singular conviction: everyday digital tasks like analyzing text, formatting JSON, calculating percentages, and generating secure passwords should be instant, reliable, accessible without installs, and completely private.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-3">
            Our Architectural Philosophy: Client-First Privacy
          </h2>
          <p>
            Traditional utility websites often force your data through remote backends, logging file names, passwords, and sensitive information on third-party servers. We took a radically different path:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>100% In-Browser Execution:</strong> Every calculation, text transformation, and file operation runs inside your local browser tab using modern JavaScript and Web APIs.
            </li>
            <li>
              <strong>Zero Server Storage:</strong> None of your passwords, texts, or files are uploaded or stored.
            </li>
            <li>
              <strong>Lightning-Fast Performance:</strong> With zero network latency after the static page loads, our tools respond in milliseconds.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-3">
            How We Keep Our Tools 100% Free
          </h2>
          <p>
            We believe access to fundamental digital utilities should never be gated behind paywalls or subscriptions. Our network is funded primarily through ethical, non-intrusive display advertising (via partners like Google AdSense). We strictly adhere to user-first design principles: ads are clearly marked, placed away from interactive buttons, and never interfere with tool usability.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-3">
            Our Long-Term Roadmap
          </h2>
          <p>
            Utilby is an evolving ecosystem. Following our Phase 1 foundation tools (Word Counter, JSON Formatter, Percentage Calculator, Text Case Converter, and Password Generator), we are rolling out image manipulation tools, vector QR generators, and PDF compression engines powered by browser Web Workers.
          </p>

          <div className="mt-8 rounded-2xl bg-indigo-50/60 p-6 border border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900/60">
            <h3 className="text-base font-bold text-indigo-950 dark:text-indigo-200">
              Have Feedback or a Tool Request?
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-indigo-900/80 dark:text-indigo-300/80">
              We continually enhance our tools based on feedback from developers, writers, and students. Please visit our <a href="/contact" className="underline font-semibold">Contact Page</a> to get in touch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
