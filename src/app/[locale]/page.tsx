import { getTranslations, setRequestLocale } from "next-intl/server";
import ArticleCard, { type ArticleItem } from "@/components/ArticleCard";
import EventCard from "@/components/EventCard";
import ProfileCard from "@/components/ProfileCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import VideoCard, { type VideoItem } from "@/components/VideoCard";
import { Link } from "@/i18n/navigation";
import { eventState } from "@/lib/dates";
import { EVENT_COLUMNS, type EventRow } from "@/lib/events";
import { getHomeSelection, inOrder } from "@/lib/featured";
import { PRACTITIONER_COLUMNS, toCards, type PractitionerRow } from "@/lib/practitioner-cards";
import { createPublicClient } from "@/lib/supabase/public";
import { btnGhost, btnPrimary, container } from "@/lib/ui";

// La page est régénérée au plus toutes les 60 secondes.
export const revalidate = 60;

type LocalizedText = Record<string, string>;
type CategoryRow = { id: string; slug: string; name: LocalizedText; description: LocalizedText | null; position: number };
type ArticleRow = ArticleItem & { id: string };
type VideoRow = VideoItem & { id: string };
type EventWithId = EventRow & { id: string };

const pick = (text: LocalizedText | null, locale: string) => (text ? (text[locale] ?? text.fr ?? "") : "");
const fallbackKeys = ["fa", "ifa", "priests", "others"] as const;
const pillarKeys = ["protection", "preservation", "transmission", "verification"] as const;
const ARTICLE_COLUMNS = "id, slug, title, summary, cover_path";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tr = await getTranslations("Referencer");
  const th = await getTranslations("HomeSections");
  const tp = await getTranslations("Directory");

  const supabase = createPublicClient();
  const { config, ids } = await getHomeSelection();
  const manual = (s: keyof typeof ids) => config[s].mode === "manual";

  const [catRes, practitionerRes, eventRes, newsRes, videoRes, docRes] = await Promise.all([
    supabase.from("categories").select("id, slug, name, description, position").order("position"),
    manual("practitioners")
      ? supabase.from("practitioners_public").select(PRACTITIONER_COLUMNS).in("id", ids.practitioners)
      : supabase.from("practitioners_public").select(PRACTITIONER_COLUMNS).order("published_at", { ascending: false }).limit(config.practitioners.max),
    manual("events")
      ? supabase.from("events").select(`id, ${EVENT_COLUMNS}`).in("id", ids.events)
      : supabase.from("events").select(`id, ${EVENT_COLUMNS}`).order("starts_at", { ascending: true }).limit(60),
    manual("news")
      ? supabase.from("articles").select(ARTICLE_COLUMNS).eq("kind", "news").in("id", ids.news)
      : supabase.from("articles").select(ARTICLE_COLUMNS).eq("kind", "news").order("published_at", { ascending: false }).limit(config.news.max),
    manual("videos")
      ? supabase.from("videos").select("id, youtube_id, title").in("id", ids.videos)
      : supabase.from("videos").select("id, youtube_id, title").order("published_at", { ascending: false }).limit(config.videos.max),
    manual("documentation")
      ? supabase.from("articles").select(ARTICLE_COLUMNS).eq("kind", "documentation").in("id", ids.documentation)
      : supabase.from("articles").select(ARTICLE_COLUMNS).eq("kind", "documentation").order("published_at", { ascending: false }).limit(config.documentation.max),
  ]);
  if (catRes.error) console.error("Supabase (categories) :", catRes.error.message);

  // Catégories
  const dbCategories = ((catRes.data ?? []) as CategoryRow[]).map((c) => ({ key: c.slug, title: pick(c.name, locale), text: pick(c.description, locale) }));
  const categories =
    dbCategories.length > 0
      ? dbCategories
      : fallbackKeys.map((k) => ({ key: k, title: t(`categories.${k}.title`), text: t(`categories.${k}.text`) }));

  // Sélections : ordre choisi par l'administrateur en mode manuel, plus récents en mode automatique
  const prRows = (practitionerRes.data ?? []) as PractitionerRow[];
  const practitioners = await toCards(supabase, (manual("practitioners") ? inOrder(prRows, ids.practitioners) : prRows).slice(0, config.practitioners.max));

  const now = Date.now();
  const evRows = ((eventRes.data ?? []) as EventWithId[]).filter((e) => eventState(e.starts_at, e.ends_at, now) !== "past");
  const events = (manual("events") ? inOrder(evRows, ids.events) : evRows).slice(0, config.events.max);

  const news = ((manual("news") ? inOrder((newsRes.data ?? []) as ArticleRow[], ids.news) : (newsRes.data ?? [])) as ArticleRow[]).slice(0, config.news.max);
  const videos = ((manual("videos") ? inOrder((videoRes.data ?? []) as VideoRow[], ids.videos) : (videoRes.data ?? [])) as VideoRow[]).slice(0, config.videos.max);
  const docs = ((manual("documentation") ? inOrder((docRes.data ?? []) as ArticleRow[], ids.documentation) : (docRes.data ?? [])) as ArticleRow[]).slice(0, config.documentation.max);

  const empty = <p className="text-muted">{th("noFeatured")}</p>;
  const subTitle = "font-serif text-xl font-bold";

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

        <section id="annuaire" className="bg-sand py-12">
          <div className={container}>
            <h2 className="font-serif text-2xl font-bold">{tp("title")}</h2>
            <form action={`/${locale}/annuaire`} method="get" className="mb-6 mt-4 flex flex-wrap gap-3" role="search">
              <label htmlFor="home-q" className="sr-only">{tp("searchLabel")}</label>
              <input id="home-q" name="q" type="search" maxLength={80} placeholder={tp("placeholder")}
                className="min-w-0 flex-1 rounded-xl border border-line bg-white px-4 py-3 text-base" />
              <button type="submit" className={btnPrimary}>{th("searchButton")}</button>
            </form>
            {practitioners.length === 0 ? empty : (
              <div className="grid gap-4 md:grid-cols-3">{practitioners.map((p) => <ProfileCard key={p.id} p={p} />)}</div>
            )}
            <Link href="/annuaire" className="mt-6 inline-block font-semibold text-gold-dark underline">{th("directoryLink")}</Link>
            <p className="mt-4 text-sm text-muted">{tp("disclaimer")}</p>
          </div>
        </section>

        <section id="evenements" className="py-12">
          <div className={container}>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl font-bold">{th("eventsTitle")}</h2>
                <p className="text-sm text-muted">{th("eventsIntro")}</p>
              </div>
              <Link href="/evenements" className="font-semibold text-gold-dark underline">{th("eventsAll")}</Link>
            </div>
            {events.length === 0 ? <p className="text-muted">{th("eventsEmpty")}</p> : (
              <div className="grid gap-4 md:grid-cols-3">{events.map((e) => <EventCard key={e.slug} event={e} />)}</div>
            )}
          </div>
        </section>

        <section id="ressources" className="bg-sand py-12">
          <div className={container}>
            <h2 className="font-serif text-2xl font-bold">{th("resourcesTitle")}</h2>
            <p className="mb-6 mt-1 max-w-2xl text-muted">{th("resourcesText")}</p>

            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <h3 className={subTitle}>{th("newsTitle")}</h3>
              <Link href={{ pathname: "/ressources", hash: "actualites" }} className="text-sm font-semibold text-gold-dark underline">{th("seeAll")}</Link>
            </div>
            {news.length === 0 ? empty : <div className="grid gap-4 md:grid-cols-3">{news.map((a) => <ArticleCard key={a.id} a={a} />)}</div>}

            <div className="mb-3 mt-10 flex flex-wrap items-end justify-between gap-3">
              <h3 className={subTitle}>{th("videosTitle")}</h3>
              <Link href={{ pathname: "/ressources", hash: "videos" }} className="text-sm font-semibold text-gold-dark underline">{th("seeAll")}</Link>
            </div>
            {videos.length === 0 ? empty : <div className="grid gap-4 md:grid-cols-3">{videos.map((v) => <VideoCard key={v.id} v={v} />)}</div>}

            <div className="mb-3 mt-10 flex flex-wrap items-end justify-between gap-3">
              <h3 className={subTitle}>{th("docsTitle")}</h3>
              <Link href={{ pathname: "/ressources", hash: "documentation" }} className="text-sm font-semibold text-gold-dark underline">{th("seeAll")}</Link>
            </div>
            {docs.length === 0 ? empty : <div className="grid gap-4 md:grid-cols-3">{docs.map((a) => <ArticleCard key={a.id} a={a} />)}</div>}
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
