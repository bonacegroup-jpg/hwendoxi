"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Header");

  return (
    <ul aria-label={t("language")} className="flex gap-3 text-sm">
      {routing.locales.map((l) => (
        <li key={l}>
          {l === locale ? (
            <span aria-current="true" className="font-bold text-gold-dark">{l.toUpperCase()}</span>
          ) : (
            <Link href={pathname} locale={l} className="text-muted hover:text-gold-dark">{l.toUpperCase()}</Link>
          )}
        </li>
      ))}
    </ul>
  );
}
