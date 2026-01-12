import type { Metadata } from "next";
import { Sidebar } from "@/components";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Importer - Admin Dashboard",
  description: "Production-ready job import system with queue-based processing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
