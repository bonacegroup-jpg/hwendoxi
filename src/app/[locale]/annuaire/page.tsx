import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import DirectoryPreview from "@/components/DirectoryPreview";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getDirectoryFilters } from "@/lib/directory-data";
import { container } from "@/lib/ui";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DirectoryPage" });
  return { title: t("title"), description: t("intro") };
}

export default async function DirectoryPage({ params, searchParams }: Props & { searchParams: Promise<{ q?: string }> }) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("DirectoryPage");
  const { categories, countries } = await getDirectoryFilters(locale);

  return (
    <>
      <SiteHeader />
      <main>
        <div className={`${container} pt-10`}>
          <h1 className="font-serif text-3xl font-bold md:text-4xl">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-muted">{t("intro")}</p>
        </div>
        <div className="mt-6">
          <DirectoryPreview categories={categories} countries={countries} initialQuery={(q ?? "").slice(0, 80)} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
