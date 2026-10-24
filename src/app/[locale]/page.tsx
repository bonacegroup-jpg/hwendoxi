import { getTranslations, setRequestLocale } from "next-intl/server";
import DirectoryPreview from "@/components/DirectoryPreview";
import EventCard from "@/components/EventCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";
import { eventState } from "@/lib/dates";
import { EVENT_COLUMNS, type EventRow } from "@/lib/events";
import { createPublicClient } from "@/lib/supabase/public";
import { btnGhost, btnPrimary, container } from "@/lib/ui";

// La page est régénérée au plus toutes les 60 secondes.
export const revalidate = 60;

type LocalizedText = Record<string, string>;
type CategoryRow = { id: string; slug: string; name: LocalizedText; description: LocalizedText | null; position: number };

const pick = (text: LocalizedText | null, locale: string) => (text ? (text[locale] ?? text.fr ?? "") : "");

const fallbackKeys = ["fa", "ifa", "priests", "others"] as const;
const pillarKeys = ["protection", "preservation", "transmission", "verification"] as const;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tr = await getTranslations("Referencer");
  const th = await getTranslations("HomeSections");

  const supabase = createPublicClient();
  const [catRes, countryRes, eventRes] = await Promise.all([
    supabase.from("categories").select("id, slug, name, description, position").order("position"),
    supabase.from("practitioners_public").select("country"),
    supabase.from("events").select(EVENT_COLUMNS).order("starts_at", { ascending: true }).limit(60),
  ]);
  if (catRes.error) console.error("Supabase (categories) :", catRes.error.message);

  const dbCategories = ((catRes.data ?? []) as CategoryRow[]).map((c) => ({
    id: c.id,
    key: c.slug,
    title: pick(c.name, locale),
    text: pick(c.description, locale),
  }));
  const categoryOptions = dbCategories.map((c) => ({ id: c.id, name: c.title }));
  const countries = Array.from(new Set(((countryRes.data ?? []) as { country: string }[]).map((r) => r.country))).sort();
  const categories =
    dbCategories.length > 0
      ? dbCategories
      : fallbackKeys.map((k) => ({ key: k, title: t(`categories.${k}.title`), text: t(`categories.${k}.text`) }));

  const now = Date.now();
  const upcoming = ((eventRes.data ?? []) as EventRow[]).filter((e) => eventState(e.starts_at, e.ends_at, now) !== "past").slice(0, 3);

  return (
    <>
      <div className="bg-ink px-3 py-1.5 text-center text-xs text-ivory">{t("devBanner")}</div>
      <SiteHeader />

      <main>
        <section className="py-14">
          <div className={container}>
            <h1 className="max-w-3xl font-serif text-3xl font-bold leading-tight md:text-5xl">{t("heroTitle")}</h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">{t("heroText")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/annuaire" className={btnPrimary}>{t("exploreDirectory")}</Link>
              <a href="#piliers" className={btnGhost}>{t("discover")}</a>
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className={container}>
            <h2 className="mb-4 font-serif text-2xl font-bold">{t("categoriesTitle")}</h2>
            <div className="grid gap-4 md:grid-cols-5">
              <Link href="/annuaire/divinites" className="rounded-2xl border border-line bg-white p-5 hover:border-gold">
                <div className="mb-3 h-1.5 w-9 rounded bg-gold" />
                <h3 className="font-serif font-bold">{t("categories.deities.title")}</h3>
                <p className="text-sm text-muted">{t("categories.deities.text")}</p>
              </Link>
              {categories.map((c) => (
                <Link key={c.key} href="/annuaire" className="rounded-2xl border border-line bg-white p-5 hover:border-gold">
                  <div className="mb-3 h-1.5 w-9 rounded bg-gold" />
                  <h3 className="font-serif font-bold">{c.title}</h3>
                  <p className="text-sm text-muted">{c.text}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <DirectoryPreview categories={categoryOptions} countries={countries} />
        <div className="bg-sand pb-10">
          <div className={container}>
            <Link href="/annuaire" className="font-semibold text-gold-dark underline">{th("directoryLink")}</Link>
          </div>
        </div>

        <section id="evenements" className="py-12">
          <div className={container}>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl font-bold">{th("eventsTitle")}</h2>
                <p className="text-sm text-muted">{th("eventsIntro")}</p>
              </div>
              <Link href="/evenements" className="font-semibold text-gold-dark underline">{th("eventsAll")}</Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-muted">{th("eventsEmpty")}</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">{upcoming.map((e) => <EventCard key={e.slug} event={e} />)}</div>
            )}
          </div>
        </section>

        <section id="ressources" className="bg-sand py-12">
          <div className={container}>
            <h2 className="font-serif text-2xl font-bold">{th("resourcesTitle")}</h2>
            <p className="mb-4 mt-1 max-w-2xl text-muted">{th("resourcesText")}</p>
            <div className="grid gap-4 md:grid-cols-3">
              {([["documentation", "documentation"], ["news", "actualites"], ["videos", "videos"]] as const).map(([k, anchor]) => (
                <Link key={k} href={{ pathname: "/ressources", hash: anchor }} className="rounded-2xl border border-line bg-white p-5 hover:border-gold">
                  <p className="font-serif text-lg font-bold">{th(k)}</p>
                </Link>
              ))}
            </div>
            <Link href="/ressources" className="mt-4 inline-block font-semibold text-gold-dark underline">{th("resourcesLink")}</Link>
          </div>
        </section>

        <section id="referencer" className="py-10">
          <div className={container}>
            <h2 className="font-serif text-2xl font-bold">{tr("title")}</h2>
            <p className="mt-2 max-w-2xl text-muted">{tr("text")}</p>
            <Link href="/referencer-un-praticien" className={`${btnPrimary} mt-4`}>{tr("button")}</Link>
          </div>
        </section>

        <section id="piliers" className="bg-sand py-12">
          <div className={container}>
            <h2 className="mb-4 font-serif text-2xl font-bold">{t("pillarsTitle")}</h2>
            <div className="grid gap-4 md:grid-cols-4">
              {pillarKeys.map((k, i) => (
                <div key={k} className="rounded-2xl border border-line bg-white p-5">
                  <p className="font-serif text-3xl font-bold text-gold-dark">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="font-serif text-lg font-bold">{t(`pillars.${k}.title`)}</h3>
                  <p className="text-sm text-muted">{t(`pillars.${k}.text`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
