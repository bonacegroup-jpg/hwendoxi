import Image from "next/image";
import { useTranslations } from "next-intl";
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
            <li><a href="#annuaire">{t("directory")}</a></li>
            <li><a href="#ressources">{t("resources")}</a></li>
            <li><a href="#referencer">{t("referencer")}</a></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-ink">{t("infoTitle")}</p>
          <ul className="mt-2 space-y-1">
            <li>{t("contactTodo")}</li>
            <li>{t("legalSoon")}</li>
            <li>{t("privacySoon")}</li>
          </ul>
        </div>
      </div>
      <p className={`${container} mt-6`}>{t("publisher")}</p>
    </footer>
  );
}
