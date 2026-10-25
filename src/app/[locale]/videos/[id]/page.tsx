import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { pickText, type LText } from "@/lib/events";
import { createPublicClient } from "@/lib/supabase/public";
import { container } from "@/lib/ui";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string; id: string }> };
type Video = { youtube_id: string; title: LText; description: LText; published_at: string | null };
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

async function getVideo(id: string) {
  if (!YOUTUBE_ID.test(id)) return null;
  const supabase = createPublicClient();
  const { data } = await supabase.from("videos").select("youtube_id, title, description, published_at").eq("youtube_id", id).maybeSingle();
  return (data as Video | null) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const v = await getVideo(id);
  if (!v) return {};
  const title = pickText(v.title, locale);
  const description = pickText(v.description, locale).slice(0, 155) || undefined;
  const path = `/videos/${id}`;
  return {
    title,
    description,
    alternates: { canonical: `/${locale}${path}`, languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])) },
    openGraph: { title, description, type: "video.other", images: [`https://i.ytimg.com/vi/${id}/hqdefault.jpg`] },
  };
}

export default async function VideoPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Resources");

  const v = await getVideo(id);
  if (!v) notFound();
  const title = pickText(v.title, locale);
  const description = pickText(v.description, locale);

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: title,
    description: description || title,
    thumbnailUrl: `https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${v.youtube_id}`,
    uploadDate: v.published_at ?? undefined,
  }).replace(/</g, "\\u003c");

  return (
    <>
      <SiteHeader />
      <main className={`${container} max-w-4xl py-10`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <Link href={{ pathname: "/ressources", hash: "videos" }} className="text-sm text-gold-dark underline">{t("back")}</Link>
        <h1 className="mb-4 mt-4 font-serif text-3xl font-bold">{title}</h1>
        <div className="aspect-video w-full overflow-hidden rounded-2xl border border-line bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${v.youtube_id}`}
            title={title}
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="size-full"
          />
        </div>
        {description && <p className="mt-6 whitespace-pre-line">{description}</p>}
        <a href={`https://www.youtube.com/watch?v=${v.youtube_id}`} rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-gold-dark underline">{t("onYoutube")}</a>
      </main>
      <SiteFooter />
    </>
  );
}
