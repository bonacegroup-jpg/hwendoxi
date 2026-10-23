import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import TrackingForm from "@/components/TrackingForm";
import { container } from "@/lib/ui";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Tracking" });
  return { title: t("title") };
}

export default async function TrackingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Tracking");

  return (
    <>
      <SiteHeader />
      <main className={`${container} max-w-3xl py-10`}>
        <h1 className="font-serif text-3xl font-bold">{t("title")}</h1>
        <p className="mt-3 text-muted">{t("intro")}</p>
        <TrackingForm />
      </main>
      <SiteFooter />
    </>
  );
}
