import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Noto_Sans, Noto_Serif } from "next/font/google";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { indexingEnabled, siteUrl } from "@/lib/site";
import "../globals.css";

// "latin-ext" couvre les caractères du yoruba et du fon (ẹ, ọ, ɖ, ɛ, ɔ…)
const sans = Noto_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-noto-sans", display: "swap" });
const serif = Noto_Serif({ subsets: ["latin", "latin-ext"], variable: "--font-noto-serif", display: "swap" });

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    metadataBase: new URL(siteUrl),
    title: { default: t("title"), template: "%s | HWENDOXI" },
    description: t("description"),
    // Non indexable tant que la variable SITE_INDEXING n'est pas réglée sur "on" dans Vercel.
    robots: indexingEnabled ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#b8860b" };

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${sans.variable} ${serif.variable}`}>
      <body className="bg-ivory font-sans text-ink antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
