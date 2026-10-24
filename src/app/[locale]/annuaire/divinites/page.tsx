import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import DeityList, { type DeityItem } from "@/components/DeityList";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { createPublicClient } from "@/lib/supabase/public";
import { container } from "@/lib/ui";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };
type L = Record<string, string>;
type Row = { slug: string; name: string; other_names: string[] | null; tradition_id: string | null; region: string | null; description: L | null };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Deities" });
  return { title: t("title"), description: t("intro") };
}

export default async function DeitiesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Deities");

  const supabase = createPublicClient();
  const [deities, traditions] = await Promise.all([
    supabase.from("deities").select("slug, name, other_names, tradition_id, region, description").order("name").limit(500),
    supabase.from("traditions").select("id, name"),
  ]);
  if (deities.error) console.error("Divinités :", deities.error.message);

  const tradName = new Map(((traditions.data ?? []) as { id: string; name: L }[]).map((x) => [x.id, x.name[locale] ?? x.name.fr ?? ""]));
  const items: DeityItem[] = ((deities.data ?? []) as Row[]).map((d) => ({
    slug: d.slug,
    name: d.name,
    otherNames: d.other_names ?? [],
    tradition: d.tradition_id ? (tradName.get(d.tradition_id) ?? "") : "",
    region: d.region,
    excerpt: (d.description?.[locale] ?? d.description?.fr ?? "").slice(0, 150),
  }));
  const traditionList = Array.from(new Set(items.map((i) => i.tradition).filter(Boolean))).sort();

  return (
    <>
      <SiteHeader />
      <main className={`${container} py-10`}>
        <h1 className="font-serif text-3xl font-bold">{t("title")}</h1>
        <p className="mb-6 mt-2 max-w-3xl text-muted">{t("intro")}</p>
        <DeityList items={items} traditions={traditionList} />
        <p className="mt-8 text-sm text-muted">{t("disclaimer")}</p>
      </main>
      <SiteFooter />
    </>
  );
}
