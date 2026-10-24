import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { eventState, formatEventDate } from "@/lib/dates";
import { EVENT_COLUMNS, pickText, type EventRow } from "@/lib/events";
import { publicMediaUrl } from "@/lib/media";
import { createPublicClient } from "@/lib/supabase/public";
import { container } from "@/lib/ui";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string; slug: string }> };

async function getEvent(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase.from("events").select(EVENT_COLUMNS).eq("slug", slug).maybeSingle();
  return (data as EventRow | null) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const e = await getEvent(slug);
  if (!e) return {};
  const title = pickText(e.title, locale);
  const description = pickText(e.description, locale).slice(0, 155) || undefined;
  const image = publicMediaUrl(e.image_path);
  const path = `/evenements/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: `/${locale}${path}`, languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])) },
    openGraph: { title, description, type: "website", images: image ? [image] : undefined },
  };
}

export default async function EventPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Events");

  const e = await getEvent(slug);
  if (!e) notFound();

  const title = pickText(e.title, locale);
  const description = pickText(e.description, locale);
  const state = eventState(e.starts_at, e.ends_at);
  const image = publicMediaUrl(e.image_path);
  const canRegister = !!e.registration_url && /^https?:\/\//i.test(e.registration_url) && state !== "past";

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Event",
    name: title,
    startDate: e.starts_at.slice(0, 16),
    endDate: e.ends_at ? e.ends_at.slice(0, 16) : undefined,
    description: description || undefined,
    image: image ?? undefined,
    location: e.location ? { "@type": "Place", name: e.location } : undefined,
    organizer: e.organizer ? { "@type": "Organization", name: e.organizer } : undefined,
  }).replace(/</g, "\\u003c");

  return (
    <>
      <SiteHeader />
      <main className={`${container} max-w-4xl py-10`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <Link href="/evenements" className="text-sm text-gold-dark underline">{t("back")}</Link>
        <span className={`mt-4 block w-fit rounded-full border px-2.5 py-0.5 text-xs font-semibold ${state === "past" ? "border-muted text-muted" : "border-forest text-forest"}`}>
          {t(`state.${state}`)}
        </span>
        <h1 className="mt-2 font-serif text-3xl font-bold">{title}</h1>

        <div className="mt-6 grid gap-8 md:grid-cols-[1fr_320px]">
          <div>
            <dl className="grid gap-x-6 gap-y-2 text-sm md:grid-cols-[150px_1fr]">
              <dt className="text-muted">{t("when")}</dt>
              <dd>{formatEventDate(e.starts_at, locale)}{e.ends_at ? ` — ${t("to")} ${formatEventDate(e.ends_at, locale)}` : ""}</dd>
              {e.location && (<><dt className="text-muted">{t("where")}</dt><dd>{e.location}</dd></>)}
              {e.organizer && (<><dt className="text-muted">{t("organizer")}</dt><dd>{e.organizer}</dd></>)}
              {e.contact && (<><dt className="text-muted">{t("contact")}</dt><dd>{e.contact}</dd></>)}
            </dl>
            <p className="mt-1 text-xs text-muted">{t("localTime")}</p>
            <p className="mt-6 whitespace-pre-line">{description || t("noDescription")}</p>
            {canRegister && (
              <a href={e.registration_url!} rel="noopener noreferrer" className="mt-6 inline-block rounded-full border-2 border-gold bg-gold px-5 py-2.5 font-semibold text-ink">
                {t("register")}
              </a>
            )}
          </div>
          {image && <Image src={image} alt="" width={640} height={640} className="h-auto w-full rounded-2xl border border-line" />}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
