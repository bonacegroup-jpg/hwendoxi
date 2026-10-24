import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { createPublicClient } from "@/lib/supabase/public";
import { container } from "@/lib/ui";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string; slug: string }> };
type L = Record<string, string>;
type Row = {
  slug: string; name: string; other_names: string[] | null; tradition_id: string | null; region: string | null;
  description: L | null; sources: { title: string; url: string | null }[] | null;
};

async function getDeity(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase.from("deities").select("*").eq("slug", slug).maybeSingle();
  if (!data) return null;
  const row = data as Row;
  let tradition: L | null = null;
  if (row.tradition_id) {
    const { data: tr } = await supabase.from("traditions").select("name").eq("id", row.tradition_id).maybeSingle();
    tradition = (tr as { name: L } | null)?.name ?? null;
  }
  return { row, tradition };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const found = await getDeity(slug);
  if (!found) return {};
  const description = (found.row.description?.[locale] ?? found.row.description?.fr ?? "").slice(0, 155);
  const path = `/annuaire/divinites/${slug}`;
  return {
    title: found.row.name,
    description: description || undefined,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])),
    },
    openGraph: { title: found.row.name, description: description || undefined, type: "article" },
  };
}

export default async function DeityPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Deities");

  const found = await getDeity(slug);
  if (!found) notFound();
  const { row, tradition } = found;
  const description = row.description?.[locale] ?? row.description?.fr ?? "";
  const sources = row.sources ?? [];

  return (
    <>
      <SiteHeader />
      <main className={`${container} max-w-3xl py-10`}>
        <Link href="/annuaire/divinites" className="text-sm text-gold-dark underline">{t("back")}</Link>
        <h1 className="mt-4 font-serif text-3xl font-bold">{row.name}</h1>

        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm md:grid-cols-[180px_1fr]">
          {(row.other_names ?? []).length > 0 && (<><dt className="text-muted">{t("otherNames")}</dt><dd>{(row.other_names ?? []).join(", ")}</dd></>)}
          {tradition && (<><dt className="text-muted">{t("tradition")}</dt><dd>{tradition[locale] ?? tradition.fr}</dd></>)}
          {row.region && (<><dt className="text-muted">{t("region")}</dt><dd>{row.region}</dd></>)}
        </dl>

        <h2 className="mb-2 mt-8 font-serif text-xl font-bold">{t("description")}</h2>
        <p className="whitespace-pre-line">{description || t("noDescription")}</p>

        {sources.length > 0 && (
          <>
            <h2 className="mb-2 mt-8 font-serif text-xl font-bold">{t("sources")}</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {sources.map((s) => (
                <li key={`${s.title}-${s.url ?? ""}`}>
                  {s.url && /^https?:\/\//i.test(s.url)
                    ? <a href={s.url} rel="noopener noreferrer" className="text-gold-dark underline">{s.title}</a>
                    : s.title}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="mt-10 rounded-xl bg-sand p-3 text-sm">{t("disclaimer")}</p>
      </main>
      <SiteFooter />
    </>
  );
}
