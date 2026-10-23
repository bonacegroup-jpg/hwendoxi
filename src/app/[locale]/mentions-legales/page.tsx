import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ContentPage from "@/components/ContentPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "LegalNotice" });
  return { title: t("title") };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  return <ContentPage locale={locale} namespace="LegalNotice" />;
}
