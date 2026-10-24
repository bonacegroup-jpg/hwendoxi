import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import CopyLinkButton from "@/components/CopyLinkButton";
import ReportForm from "@/components/ReportForm";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { publicMediaUrl } from "@/lib/media";
import { createPublicClient } from "@/lib/supabase/public";
import { container } from "@/lib/ui";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string; slug: string }> };
type Row = {
  id: string;
  slug: string;
  display_name: string;
  title: string;
  category_id: string | null;
  specialties: string[] | null;
  years_declared: number | null;
  bio: string | null;
  country: string;
  city: string;
  verification_level: number;
  photo_path: string | null;
};
type Contact = { kind: string; value: string };

async function getPractitioner(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase.from("practitioners_public").select("*").eq("slug", slug).maybeSingle();
  if (!data) return null;
  const row = data as Row;

  const [contacts, category] = await Promise.all([
    supabase.from("practitioner_contacts_public").select("kind, value").eq("practitioner_id", row.id),
    row.category_id
      ? supabase.from("categories").select("name").eq("id", row.category_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return {
    row,
    contacts: (contacts.data ?? []) as Contact[],
    categoryName: (category.data as { name: Record<string, string> } | null)?.name ?? null,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const found = await getPractitioner(slug);
  if (!found) return {};
  const { row } = found;
  const description = row.bio ? row.bio.slice(0, 155) : `${row.title} — ${row.city}, ${row.country}`;
  const path = `/annuaire/praticiens/${slug}`;
  const photo = publicMediaUrl(row.photo_path);
  return {
    title: row.display_name,
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])),
    },
    openGraph: { title: row.display_name, description, type: "profile", images: photo ? [photo] : undefined },
  };
}

// Liens sûrs : seules les adresses http(s) deviennent des liens cliquables.
function contactHref(kind: string, value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (kind === "phone") return digits ? `tel:+${digits}` : null;
  if (kind === "whatsapp") return digits ? `https://wa.me/${digits}` : null;
  return /^https?:\/\//i.test(value) ? value : null;
}

export default async function PractitionerPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Profile");
  const td = await getTranslations("Directory");

  const found = await getPractitioner(slug);
  if (!found) notFound();
  const { row, contacts, categoryName } = found;

  const photoUrl = publicMediaUrl(row.photo_path);
  const level = (row.verification_level >= 1 && row.verification_level <= 3 ? row.verification_level : 1) as 1 | 2 | 3;
  const category = categoryName ? (categoryName[locale] ?? categoryName.fr ?? "") : "";

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: row.display_name,
    jobTitle: row.title,
    image: photoUrl ?? undefined,
    address: { "@type": "PostalAddress", addressLocality: row.city, addressCountry: row.country },
  }).replace(/</g, "\\u003c");

  return (
    <>
      <SiteHeader />
      <main className={`${container} py-10`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <Link href="/" className="text-sm text-gold-dark underline">{t("back")}</Link>

        <div className="mt-6 grid gap-8 md:grid-cols-[320px_1fr]">
          <aside className="rounded-2xl border border-line bg-white p-6">
            <div className="mb-4"><Avatar name={row.display_name} photoUrl={photoUrl} size={112} /></div>
            <h1 className="font-serif text-2xl font-bold leading-tight">{row.display_name}</h1>
            <p className="mt-2 font-semibold">{row.title}</p>
            <p className="text-sm text-muted">{`${row.country} · ${row.city}`}</p>
            <span className="mt-3 inline-block rounded-full border border-forest px-2.5 py-0.5 text-xs font-semibold text-forest">
              {td(`levels.${level}`)}
            </span>
            <p className="mt-3 text-xs text-muted">{t("verificationNote")}</p>
          </aside>

          <section>
            <h2 className="mb-2 font-serif text-xl font-bold">{t("about")}</h2>
            <p className="whitespace-pre-line">{row.bio ?? t("bioEmpty")}</p>

            <dl className="mt-6 grid gap-x-6 gap-y-2 text-sm md:grid-cols-[200px_1fr]">
              {category && (<><dt className="text-muted">{t("category")}</dt><dd>{category}</dd></>)}
              {row.specialties && row.specialties.length > 0 && (
                <><dt className="text-muted">{t("specialties")}</dt><dd>{row.specialties.join(", ")}</dd></>
              )}
              {row.years_declared !== null && (
                <><dt className="text-muted">{t("years")}</dt><dd>{String(row.years_declared)}</dd></>
              )}
            </dl>

            <h2 className="mb-2 mt-8 font-serif text-xl font-bold">{t("contact")}</h2>
            {contacts.length === 0 ? (
              <p className="text-sm text-muted">{t("noContact")}</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {contacts.map((c) => {
                  const href = contactHref(c.kind, c.value);
                  return (
                    <li key={`${c.kind}-${c.value}`}>
                      <span className="text-muted">{t(`kinds.${c.kind}`)} : </span>
                      {href ? (
                        <a href={href} rel="noopener noreferrer" className="text-gold-dark underline">{c.value}</a>
                      ) : (
                        <span>{c.value}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-6">
              <CopyLinkButton />
            </div>
            <ReportForm practitionerId={row.id} />
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
