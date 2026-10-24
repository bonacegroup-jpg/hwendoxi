import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";
import { pickText, type LText } from "@/lib/events";
import { createPublicClient } from "@/lib/supabase/public";
import { container } from "@/lib/ui";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };
type Article = { slug: string; kind: string; title: LText; summary: LText };
type Video = { youtube_id: string; title: LText; description: LText };
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Resources" });
  return { title: t("title"), description: t("intro") };
}

export default async function ResourcesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Resources");

  const supabase = createPublicClient();
  const [articles, videos] = await Promise.all([
    supabase.from("articles").select("slug, kind, title, summary").order("published_at", { ascending: false }).limit(60),
    supabase.from("videos").select("youtube_id, title, description").order("published_at", { ascending: false }).limit(24),
  ]);
  const rows = (articles.data ?? []) as Article[];
  const docs = rows.filter((a) => a.kind === "documentation");
  const news = rows.filter((a) => a.kind === "news");
  const vids = ((videos.data ?? []) as Video[]).filter((v) => YOUTUBE_ID.test(v.youtube_id));

  const list = (items: Article[], empty: string) =>
    items.length === 0 ? (
      <p className="text-muted">{empty}</p>
    ) : (
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((a) => (
          <article key={a.slug} className="rounded-2xl border border-line bg-white p-5">
            <h3 className="font-serif text-lg font-bold leading-tight">{pickText(a.title, locale)}</h3>
            <p className="mt-2 text-sm text-muted">{pickText(a.summary, locale)}</p>
            <Link href={`/ressources/${a.slug}`} className="mt-3 inline-block font-semibold text-gold-dark underline">{t("read")}</Link>
          </article>
        ))}
      </div>
    );

  return (
    <>
      <SiteHeader />
      <main className={`${container} py-10`}>
        <h1 className="font-serif text-3xl font-bold md:text-4xl">{t("title")}</h1>
        <p className="mt-2 max-w-3xl text-muted">{t("intro")}</p>

        <h2 id="documentation" className="mb-4 mt-10 scroll-mt-24 font-serif text-2xl font-bold">{t("documentation")}</h2>
        {list(docs, t("emptyDocs"))}

        <h2 id="actualites" className="mb-4 mt-12 scroll-mt-24 font-serif text-2xl font-bold">{t("news")}</h2>
        {list(news, t("emptyNews"))}

        <h2 id="videos" className="mb-4 mt-12 scroll-mt-24 font-serif text-2xl font-bold">{t("videos")}</h2>
        {vids.length === 0 ? (
          <p className="text-muted">{t("emptyVideos")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {vids.map((v) => (
              <article key={v.youtube_id} className="overflow-hidden rounded-2xl border border-line bg-white">
                <a href={`https://www.youtube.com/watch?v=${v.youtube_id}`} rel="noopener noreferrer" aria-label={t("watch")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`} alt="" loading="lazy" className="aspect-video w-full object-cover" />
                </a>
                <div className="p-4">
                  <h3 className="font-serif font-bold leading-tight">{pickText(v.title, locale)}</h3>
                  <a href={`https://www.youtube.com/watch?v=${v.youtube_id}`} rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-gold-dark underline">{t("watch")}</a>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
