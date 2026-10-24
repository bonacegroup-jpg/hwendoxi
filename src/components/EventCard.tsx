import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { eventState, formatEventDate } from "@/lib/dates";
import { pickText, type EventRow } from "@/lib/events";
import { publicMediaUrl } from "@/lib/media";

export default function EventCard({ event }: { event: EventRow }) {
  const t = useTranslations("Events");
  const locale = useLocale();
  const state = eventState(event.starts_at, event.ends_at);
  const image = publicMediaUrl(event.image_path);
  const title = pickText(event.title, locale);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
      {image && <Image src={image} alt="" width={640} height={360} className="h-44 w-full object-cover" />}
      <div className="flex flex-1 flex-col p-5">
        <span className={`mb-2 w-fit rounded-full border px-2.5 py-0.5 text-xs font-semibold ${state === "past" ? "border-muted text-muted" : "border-forest text-forest"}`}>
          {t(`state.${state}`)}
        </span>
        <h3 className="font-serif text-lg font-bold leading-tight">{title}</h3>
        <p className="mt-2 text-sm text-muted">{formatEventDate(event.starts_at, locale)}</p>
        {event.location && <p className="text-sm text-muted">{event.location}</p>}
        <Link href={`/evenements/${event.slug}`} className="mt-3 inline-block font-semibold text-gold-dark underline">{t("view")}</Link>
      </div>
    </article>
  );
}
