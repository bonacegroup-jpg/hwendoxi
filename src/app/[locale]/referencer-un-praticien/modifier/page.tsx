import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import EditProfile from "@/components/EditProfile";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { createPublicClient } from "@/lib/supabase/public";
import { container } from "@/lib/ui";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Edit" });
  return { title: t("title") };
}

export default async function EditPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Edit");

  const supabase = createPublicClient();
  const { data } = await supabase.from("categories").select("id, name, position").order("position");
  const categories = ((data ?? []) as { id: string; name: Record<string, string> }[]).map((c) => ({
    id: c.id,
    name: c.name[locale] ?? c.name.fr ?? "",
  }));

  return (
    <>
      <SiteHeader />
      <main className={`${container} max-w-3xl py-10`}>
        <h1 className="font-serif text-3xl font-bold">{t("title")}</h1>
        <p className="mb-6 mt-3 text-muted">{t("intro")}</p>
        <EditProfile categories={categories} />
      </main>
      <SiteFooter />
    </>
  );
}
