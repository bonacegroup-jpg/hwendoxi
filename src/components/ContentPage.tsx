import { getTranslations, setRequestLocale } from "next-intl/server";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { container } from "@/lib/ui";

type Section = { title: string; body: string };

// Page de texte simple (À propos, mentions légales, confidentialité) alimentée par messages/*.json
export default async function ContentPage({ locale, namespace }: { locale: string; namespace: string }) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace });
  const tc = await getTranslations({ locale, namespace: "Common" });
  const sections = t.raw("sections") as Section[];

  return (
    <>
      <SiteHeader />
      <main className={`${container} max-w-3xl py-12`}>
        <h1 className="font-serif text-3xl font-bold">{t("title")}</h1>
        {namespace !== "About" && (
          <p className="mt-3 rounded-xl border border-line bg-sand p-3 text-sm">{tc("provisional")}</p>
        )}
        <p className="mt-4 text-lg text-muted">{t("intro")}</p>
        {sections.map((s) => (
          <section key={s.title} className="mt-8">
            <h2 className="mb-2 font-serif text-xl font-bold">{s.title}</h2>
            <p className="whitespace-pre-line">{s.body}</p>
          </section>
        ))}
      </main>
      <SiteFooter />
    </>
  );
}
