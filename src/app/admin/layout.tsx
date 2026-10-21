import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Portal | Utilby Network",
  description: "Secure administrative dashboard for Utilby Network.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-slate-900 text-slate-100">{children}</div>;
}
