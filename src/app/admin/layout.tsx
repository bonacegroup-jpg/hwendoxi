import type { Metadata } from "next";
import { Noto_Sans, Noto_Serif } from "next/font/google";
import "../globals.css";

const sans = Noto_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-noto-sans", display: "swap" });
const serif = Noto_Serif({ subsets: ["latin", "latin-ext"], variable: "--font-noto-serif", display: "swap" });

export const metadata: Metadata = {
  title: "Administration — HWENDOXI",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${sans.variable} ${serif.variable}`}>
      <body className="bg-ivory font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
