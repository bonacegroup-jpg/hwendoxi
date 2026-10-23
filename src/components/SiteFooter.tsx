import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { container } from "@/lib/ui";

export default function SiteFooter() {
  const t = useTranslations("Footer");

  return (
    <footer id="contact" className="border-t border-line bg-white py-10 text-sm text-muted">
      <div className={`${container} grid gap-8 md:grid-cols-[2fr_1fr_1fr]`}>
        <div>
          <Image src="/images/logo-hwendoxi.jpg" alt="HWENDOXI" width={977} height={188} className="mb-3 h-9 w-auto" />
          <p>{t("tagline")}</p>
        </div>
        <div>
          <p className="font-semibold text-ink">{t("navTitle")}</p>
          <ul className="mt-2 space-y-1">
            <li><Link href={{ pathname: "/", hash: "annuaire" }}>{t("directory")}</Link></li>
            <li><Link href={{ pathname: "/", hash: "ressources" }}>{t("resources")}</Link></li>
            <li><Link href="/referencer-un-praticien">{t("referencer")}</Link></li>
            <li><Link href="/a-propos">{t("about")}</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-ink">{t("infoTitle")}</p>
          <ul className="mt-2 space-y-1">
            <li>{t("contactTodo")}</li>
            <li><Link href="/mentions-legales">{t("legal")}</Link></li>
            <li><Link href="/confidentialite">{t("privacy")}</Link></li>
          </ul>
        </div>
      </div>
      <p className={`${container} mt-6`}>{t("publisher")}</p>
    </footer>
  );
}
