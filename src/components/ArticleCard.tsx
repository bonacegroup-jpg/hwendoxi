import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { pickText, type LText } from "@/lib/events";
import { publicMediaUrl } from "@/lib/media";

export type ArticleItem = { slug: string; title: LText; summary: LText; cover_path: string | null };

export default function ArticleCard({ a }: { a: ArticleItem }) {
  const t = useTranslations("Resources");
  const locale = useLocale();
  const cover = publicMediaUrl(a.cover_path);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
      {cover && <Image src={cover} alt="" width={640} height={360} className="h-44 w-full object-cover" />}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg font-bold leading-tight">{pickText(a.title, locale)}</h3>
        <p className="mt-2 text-sm text-muted">{pickText(a.summary, locale)}</p>
        <Link href={`/ressources/${a.slug}`} className="mt-3 inline-block font-semibold text-gold-dark underline">{t("read")}</Link>
      </div>
    </article>
  );
}
