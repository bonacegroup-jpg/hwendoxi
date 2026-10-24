"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { btnPrimary, container } from "@/lib/ui";
import LanguageSwitcher from "./LanguageSwitcher";

export default function SiteHeader() {
  const t = useTranslations("Header");
  const n = useTranslations("Nav");
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const linkClass = "text-[15px] hover:text-gold-dark";

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white">
      <div className={`${container} relative flex min-h-16 items-center gap-4`}>
        <Link href="/" aria-label={t("home")}>
          <Image src="/images/logo-hwendoxi.jpg" alt="HWENDOXI" width={977} height={188} priority className="h-9 w-auto" />
        </Link>

        <button
          type="button"
          className="ml-auto rounded-lg border border-line px-3 py-2 text-sm lg:hidden"
          aria-expanded={open}
          aria-controls="menu-principal"
          onClick={() => setOpen((v) => !v)}
        >
          {t("menu")}
        </button>

        <nav
          id="menu-principal"
          aria-label={t("navLabel")}
          className={`${open ? "flex" : "hidden"} absolute left-0 right-0 top-full flex-col items-start gap-3 border-b border-line bg-white px-5 py-4 lg:static lg:ml-auto lg:flex lg:flex-row lg:items-center lg:gap-5 lg:border-0 lg:p-0`}
        >
          <Link href="/annuaire" className={linkClass} onClick={close}>{n("directory")}</Link>
          <Link href="/annuaire/divinites" className={linkClass} onClick={close}>{n("deities")}</Link>
          <Link href="/evenements" className={linkClass} onClick={close}>{n("events")}</Link>
          <Link href="/ressources" className={linkClass} onClick={close}>{n("resources")}</Link>
          <Link href="/a-propos" className={linkClass} onClick={close}>{n("about")}</Link>
          <a href="#contact" className={linkClass} onClick={close}>{n("contact")}</a>
          <LanguageSwitcher />
          <Link href="/referencer-un-praticien" className={btnPrimary} onClick={close}>{t("cta")}</Link>
        </nav>
      </div>
    </header>
  );
}
