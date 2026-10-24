import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { formatEventDate } from "@/lib/dates";
import { pickText, type LText } from "@/lib/events";
import { createPublicClient } from "@/lib/supabase/public";
import { container } from "@/lib/ui";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string; slug: string }> };
type Article = { slug: string; title: LText; summary: LText; body: LText; published_at: string | null };

async function getArticle(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase.from("articles").select("slug, title, summary, body, published_at").eq("slug", slug).maybeSingle();
  return (data as Article | null) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const a = await getArticle(slug);
  if (!a) return {};
  const title = pickText(a.title, locale);
  const description = (pickText(a.summary, locale) || pickText(a.body, locale)).slice(0, 155) || undefined;
  const path = `/ressources/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: `/${locale}${path}`, languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])) },
    openGraph: { title, description, type: "article" },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Resources");

  const a = await getArticle(slug);
  if (!a) notFound();

  return (
    <>
      <SiteHeader />
      <main className={`${container} max-w-3xl py-10`}>
        <Link href="/ressources" className="text-sm text-gold-dark underline">{t("back")}</Link>
        <h1 className="mt-4 font-serif text-3xl font-bold">{pickText(a.title, locale)}</h1>
        {a.published_at && <p className="mt-1 text-sm text-muted">{formatEventDate(a.published_at, locale, false)}</p>}
        <p className="mt-6 whitespace-pre-line">{pickText(a.body, locale) || t("noBody")}</p>
      </main>
      <SiteFooter />
    </>
  );
}
