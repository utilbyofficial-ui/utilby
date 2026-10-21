import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Mail, MessageSquare, Clock, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact & Support | Utilby Network",
  description:
    "Get in touch with the Utilby team for support, feature suggestions, bug reports, and business inquiries.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Contact Us" }]} />

      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Contact & Support
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl">
          We welcome your feedback, bug reports, partnership inquiries, and suggestions for new utility tools.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-800/40">
            <Mail className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Email Us</h3>
            <p className="mt-1 text-xs text-slate-500">For general support & business questions:</p>
            <a
              href="mailto:support@utilby.com"
              className="mt-3 block text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              support@utilby.com
            </a>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-800/40">
            <Clock className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Response Time</h3>
            <p className="mt-1 text-xs text-slate-500">
              Our engineering team responds to all inquiries within 24 to 48 business hours.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-800/40">
            <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400 mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bug Reports</h3>
            <p className="mt-1 text-xs text-slate-500">
              Found a bug or an edge-case calculation error? Please include steps to reproduce.
            </p>
          </div>
        </div>

        {/* Contact Form Placeholder */}
        <div className="mt-10 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Send Us a Direct Message
          </h2>
          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Smith"
                  required
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. alex@example.com"
                  required
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Subject
              </label>
              <input
                type="text"
                placeholder="e.g. Feature request for Word Counter"
                required
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Message
              </label>
              <textarea
                rows={4}
                placeholder="Write your message here..."
                required
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
