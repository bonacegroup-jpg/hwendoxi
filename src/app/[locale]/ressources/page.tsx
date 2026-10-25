import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ArticleCard, { type ArticleItem } from "@/components/ArticleCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import VideoCard, { type VideoItem } from "@/components/VideoCard";
import { createPublicClient } from "@/lib/supabase/public";
import { container } from "@/lib/ui";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };
type Article = ArticleItem & { kind: string };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Resources" });
  return { title: t("title"), description: t("intro") };
}

// Ordre des rubriques : Actualités, puis Vidéos et émissions, puis Documentation.
export default async function ResourcesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Resources");

  const supabase = createPublicClient();
  const [articles, videos] = await Promise.all([
    supabase.from("articles").select("slug, kind, title, summary, cover_path").order("published_at", { ascending: false }).limit(90),
    supabase.from("videos").select("youtube_id, title").order("published_at", { ascending: false }).limit(36),
  ]);
  const rows = (articles.data ?? []) as Article[];
  const news = rows.filter((a) => a.kind === "news");
  const docs = rows.filter((a) => a.kind === "documentation");
  const vids = (videos.data ?? []) as VideoItem[];

  const grid = (children: React.ReactNode[], empty: string) =>
    children.length === 0 ? <p className="text-muted">{empty}</p> : <div className="grid gap-4 md:grid-cols-3">{children}</div>;

  return (
    <>
      <SiteHeader />
      <main className={`${container} py-10`}>
        <h1 className="font-serif text-3xl font-bold md:text-4xl">{t("title")}</h1>
        <p className="mt-2 max-w-3xl text-muted">{t("intro")}</p>

        <h2 id="actualites" className="mb-4 mt-10 scroll-mt-24 font-serif text-2xl font-bold">{t("news")}</h2>
        {grid(news.map((a) => <ArticleCard key={a.slug} a={a} />), t("emptyNews"))}

        <h2 id="videos" className="mb-4 mt-12 scroll-mt-24 font-serif text-2xl font-bold">{t("videos")}</h2>
        {grid(vids.map((v) => <VideoCard key={v.youtube_id} v={v} />), t("emptyVideos"))}

        <h2 id="documentation" className="mb-4 mt-12 scroll-mt-24 font-serif text-2xl font-bold">{t("documentation")}</h2>
        {grid(docs.map((a) => <ArticleCard key={a.slug} a={a} />), t("emptyDocs"))}
      </main>
      <SiteFooter />
    </>
  );
}
