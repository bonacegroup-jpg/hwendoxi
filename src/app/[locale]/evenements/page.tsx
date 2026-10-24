import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import EventCard from "@/components/EventCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { eventState } from "@/lib/dates";
import { EVENT_COLUMNS, type EventRow } from "@/lib/events";
import { createPublicClient } from "@/lib/supabase/public";
import { container } from "@/lib/ui";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Events" });
  return { title: t("title"), description: t("intro") };
}

export default async function EventsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Events");

  const supabase = createPublicClient();
  const { data, error } = await supabase.from("events").select(EVENT_COLUMNS).order("starts_at", { ascending: true }).limit(300);
  if (error) console.error("Événements :", error.message);

  const now = Date.now();
  const rows = (data ?? []) as EventRow[];
  const upcoming = rows.filter((r) => eventState(r.starts_at, r.ends_at, now) !== "past");
  const past = rows.filter((r) => eventState(r.starts_at, r.ends_at, now) === "past").reverse().slice(0, 24);

  return (
    <>
      <SiteHeader />
      <main className={`${container} py-10`}>
        <h1 className="font-serif text-3xl font-bold md:text-4xl">{t("title")}</h1>
        <p className="mt-2 max-w-3xl text-muted">{t("intro")}</p>
        <p className="mt-1 text-xs text-muted">{t("localTime")}</p>

        <h2 className="mb-4 mt-8 font-serif text-2xl font-bold">{t("upcoming")}</h2>
        {upcoming.length === 0 ? (
          <p className="text-muted">{t("noUpcoming")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">{upcoming.map((e) => <EventCard key={e.slug} event={e} />)}</div>
        )}

        <h2 className="mb-4 mt-12 font-serif text-2xl font-bold">{t("past")}</h2>
        {past.length === 0 ? (
          <p className="text-muted">{t("noPast")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">{past.map((e) => <EventCard key={e.slug} event={e} />)}</div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
