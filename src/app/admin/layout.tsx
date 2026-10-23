import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner Dashboard | Utilby",
  description: "Private owner dashboard for Utilby.",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
