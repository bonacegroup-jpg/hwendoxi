import { getTranslations, setRequestLocale } from "next-intl/server";
import DirectoryPreview from "@/components/DirectoryPreview";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { btnGhost, btnPrimary, container } from "@/lib/ui";

// La page est régénérée au plus toutes les 60 secondes (les catégories changent rarement).
export const revalidate = 60;

type LocalizedText = Record<string, string>;
type CategoryRow = { id: string; slug: string; name: LocalizedText; description: LocalizedText | null; position: number };

const pick = (text: LocalizedText | null, locale: string) => (text ? (text[locale] ?? text.fr ?? "") : "");

const fallbackKeys = ["fa", "ifa", "priests", "others"] as const;
const resourceKeys = ["documentation", "news", "events"] as const;
const pillarKeys = ["protection", "preservation", "transmission", "verification"] as const;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tr = await getTranslations("Referencer");

  // Catégories lues dans la base de données Supabase
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, description, position")
    .order("position");
  if (error) console.error("Supabase (categories) :", error.message);

  const rows = (data ?? []) as CategoryRow[];
  const dbCategories = rows.map((c) => ({
    id: c.id,
    key: c.slug,
    title: pick(c.name, locale),
    text: pick(c.description, locale),
  }));
  const categoryOptions = dbCategories.map((c) => ({ id: c.id, name: c.title }));

  // Pays présents parmi les profils validés (pour le filtre de l'annuaire)
  const { data: countryRows } = await supabase.from("practitioners_public").select("country");
  const countries = Array.from(new Set((countryRows ?? []).map((r) => (r as { country: string }).country))).sort();

  // Valeurs de secours si la base est inaccessible
  const categories =
    dbCategories.length > 0
      ? dbCategories
      : fallbackKeys.map((k) => ({
          key: k,
          title: t(`categories.${k}.title`),
          text: t(`categories.${k}.text`),
        }));

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
              <a href="#annuaire" className={btnPrimary}>{t("exploreDirectory")}</a>
              <a href="#piliers" className={btnGhost}>{t("discover")}</a>
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className={container}>
            <h2 className="mb-4 font-serif text-2xl font-bold">{t("categoriesTitle")}</h2>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="rounded-2xl border border-line bg-white p-5">
                <div className="mb-3 h-1.5 w-9 rounded bg-gold" />
                <h3 className="font-serif font-bold">{t("categories.deities.title")}</h3>
                <p className="text-sm text-muted">{t("categories.deities.text")}</p>
              </div>
              {categories.map((c) => (
                <div key={c.key} className="rounded-2xl border border-line bg-white p-5">
                  <div className="mb-3 h-1.5 w-9 rounded bg-gold" />
                  <h3 className="font-serif font-bold">{c.title}</h3>
                  <p className="text-sm text-muted">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <DirectoryPreview categories={categoryOptions} countries={countries} />

        <section id="ressources" className="py-12">
          <div className={`${container} grid gap-4 md:grid-cols-3`}>
            {resourceKeys.map((k) => (
              <div key={k} className="rounded-2xl border border-line bg-white p-5">
                <p className="text-sm font-semibold text-gold-dark">{t(`resources.${k}.title`)}</p>
                <p className="text-sm text-muted">{t(`resources.${k}.text`)}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="referencer" className="bg-sand py-10">
          <div className={container}>
            <h2 className="font-serif text-2xl font-bold">{tr("title")}</h2>
            <p className="mt-2 max-w-2xl text-muted">{tr("text")}</p>
            <Link href="/referencer-un-praticien" className={`${btnPrimary} mt-4`}>{tr("button")}</Link>
          </div>
        </section>

        <section id="piliers" className="py-12">
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
