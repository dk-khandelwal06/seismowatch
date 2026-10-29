import type { Metadata } from "next";
import "@/styles/globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "SeismoWatch | Seismic Monitoring & Statistical Anomaly Analysis",
  description:
    "Real-time earthquake catalog monitoring and prospective rolling-window statistical anomaly analysis across the Indian Subcontinent and Himalayan seismic belt (6°–38°N, 68°–98°E).",
  keywords: [
    "earthquake",
    "seismology",
    "Himalayan seismic belt",
    "India earthquakes",
    "USGS",
    "anomaly detection",
    "z-score",
    "geospatial",
  ],
  authors: [{ name: "SeismoWatch Observatory" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Anti-flash script for dark/light mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('seismowatch-theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#060911] text-slate-900 dark:text-slate-100 antialiased selection:bg-sky-500/30 selection:text-sky-300">
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
