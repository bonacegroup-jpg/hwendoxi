import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import CopyLinkButton from "@/components/CopyLinkButton";
import Markdown from "@/components/Markdown";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { formatEventDate } from "@/lib/dates";
import { pickText, type LText } from "@/lib/events";
import { publicMediaUrl } from "@/lib/media";
import { createPublicClient } from "@/lib/supabase/public";
import { container } from "@/lib/ui";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string; slug: string }> };
type Article = { slug: string; kind: string; title: LText; summary: LText; body: LText; cover_path: string | null; published_at: string | null };

async function getArticle(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase.from("articles").select("slug, kind, title, summary, body, cover_path, published_at").eq("slug", slug).maybeSingle();
  return (data as Article | null) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const a = await getArticle(slug);
  if (!a) return {};
  const title = pickText(a.title, locale);
  const description = (pickText(a.summary, locale) || pickText(a.body, locale).replace(/[#*>![\]()-]/g, "")).slice(0, 155) || undefined;
  const cover = publicMediaUrl(a.cover_path);
  const path = `/ressources/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: `/${locale}${path}`, languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])) },
    openGraph: { title, description, type: "article", images: cover ? [cover] : undefined },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Resources");

  const a = await getArticle(slug);
  if (!a) notFound();

  const title = pickText(a.title, locale);
  const summary = pickText(a.summary, locale);
  const body = pickText(a.body, locale);
  const cover = publicMediaUrl(a.cover_path);
  const section = a.kind === "news" ? "actualites" : "documentation";

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: summary || undefined,
    image: cover ?? undefined,
    datePublished: a.published_at ?? undefined,
  }).replace(/</g, "\\u003c");

  return (
    <>
      <SiteHeader />
      <main className={`${container} max-w-3xl py-10`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <Link href={{ pathname: "/ressources", hash: section }} className="text-sm text-gold-dark underline">{t("back")}</Link>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-gold-dark">{a.kind === "news" ? t("news") : t("documentation")}</p>
        <h1 className="mt-1 font-serif text-3xl font-bold leading-tight md:text-4xl">{title}</h1>
        {a.published_at && <p className="mt-2 text-sm text-muted">{formatEventDate(a.published_at, locale, false)}</p>}
        {summary && <p className="mt-4 text-lg leading-relaxed text-muted">{summary}</p>}
        {cover && (
          <Image src={cover} alt="" width={1200} height={675} priority sizes="(min-width: 768px) 768px, 100vw" className="mt-6 h-auto w-full rounded-2xl border border-line object-cover" />
        )}
        <div className="mt-6 text-lg">
          {body ? <Markdown text={body} /> : <p className="text-muted">{t("noBody")}</p>}
        </div>
        <div className="mt-8"><CopyLinkButton /></div>
      </main>
      <SiteFooter />
    </>
  );
}
