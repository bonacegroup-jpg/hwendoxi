import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { pickText, type LText } from "@/lib/events";

export type VideoItem = { youtube_id: string; title: LText };
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export default function VideoCard({ v }: { v: VideoItem }) {
  const t = useTranslations("Resources");
  const locale = useLocale();
  if (!YOUTUBE_ID.test(v.youtube_id)) return null;

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white">
      <Link href={`/videos/${v.youtube_id}`} aria-label={t("watch")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`} alt="" loading="lazy" className="aspect-video w-full object-cover" />
      </Link>
      <div className="p-4">
        <h3 className="font-serif font-bold leading-tight">{pickText(v.title, locale)}</h3>
        <Link href={`/videos/${v.youtube_id}`} className="mt-2 inline-block text-sm font-semibold text-gold-dark underline">{t("watch")}</Link>
      </div>
    </article>
  );
}
