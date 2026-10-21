import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "Privacy Policy | UtilityBox Network",
  description:
    "Privacy Policy for UtilityBox Network: our strict commitment to 100% client-side processing, cookie disclosures, and GDPR/CCPA compliance.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Privacy Policy" }]} />

      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Privacy Policy
        </h1>
        <p className="mt-2 text-xs text-slate-400">
          Last updated: October 2026
        </p>

        <div className="prose prose-slate max-w-none dark:prose-invert space-y-6 mt-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            At <strong>UtilityBox</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), we consider the privacy of our visitors to be of paramount importance. This Privacy Policy document outlines the types of personal and technical information collected and recorded by UtilityBox and how we strictly safeguard it.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. Core Principle: 100% Client-Side Processing
          </h2>
          <p>
            The fundamental architecture of UtilityBox is built on local browser execution:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>We do <strong>not</strong> upload, transmit, store, or log any text, JSON payloads, passwords, documents, or files you input into our utility tools.</li>
            <li>All processing is performed locally inside your device&apos;s web browser via native client-side JavaScript APIs and Web Workers.</li>
            <li>No user-generated inputs are ever accessible to our servers, staff, or any third parties.</li>
          </ul>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. Log Files & Analytics
          </h2>
          <p>
            Like standard websites, UtilityBox may utilize basic server access logs and privacy-preserving analytics (such as Google Analytics 4) to monitor general web traffic patterns, such as browser type, referring pages, timestamps, and page views. This technical information is purely aggregated, anonymized, and does not identify any individual person.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Cookies & Web Beacons
          </h2>
          <p>
            UtilityBox uses cookies strictly where necessary to preserve your user interface preferences (such as dark/light theme mode or indentation preferences).
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Third-Party Advertising & Google AdSense
          </h2>
          <p>
            To keep all tools free for universal public access, we partner with third-party advertising vendors, including Google:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Google, as a third-party vendor, uses cookies to serve ads on our site based on a user&apos;s prior visits to our website or other websites on the Internet.</li>
            <li>Google&apos;s use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our sites and/or other sites on the Internet.</li>
            <li>Users may opt out of personalized advertising by visiting Google&apos;s Ads Settings (<a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">https://www.google.com/settings/ads</a>) or via <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">www.aboutads.info</a>.</li>
          </ul>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            5. GDPR and CCPA Compliance
          </h2>
          <p>
            If you are a resident of the European Economic Area (EEA) or California, you are afforded specific data privacy rights. Because UtilityBox does not collect, sell, or retain personal information, accounts, or user content, your personal data footprint on our site is minimal to non-existent.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            6. Changes to this Privacy Policy
          </h2>
          <p>
            We may update our Privacy Policy periodically. Any revisions will be reflected on this page with an updated modification date.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            7. Contact Information
          </h2>
          <p>
            If you have questions or require more information about our Privacy Policy, please contact us at <a href="mailto:privacy@utilitybox.net" className="text-indigo-600 underline">privacy@utilitybox.net</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
