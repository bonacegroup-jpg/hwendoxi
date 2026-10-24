"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { btnPrimary, container } from "@/lib/ui";
import LanguageSwitcher from "./LanguageSwitcher";

export default function SiteHeader() {
  const t = useTranslations("Header");
  const td = useTranslations("Deities");
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
          className="ml-auto rounded-lg border border-line px-3 py-2 text-sm md:hidden"
          aria-expanded={open}
          aria-controls="menu-principal"
          onClick={() => setOpen((v) => !v)}
        >
          {t("menu")}
        </button>

        <nav
          id="menu-principal"
          aria-label={t("navLabel")}
          className={`${open ? "flex" : "hidden"} absolute left-0 right-0 top-full flex-col items-start gap-3 border-b border-line bg-white px-5 py-4 md:static md:ml-auto md:flex md:flex-row md:items-center md:gap-5 md:border-0 md:p-0`}
        >
          <Link href={{ pathname: "/", hash: "annuaire" }} className={linkClass} onClick={close}>{t("directory")}</Link>
          <Link href="/annuaire/divinites" className={linkClass} onClick={close}>{td("navLabel")}</Link>
          <Link href={{ pathname: "/", hash: "ressources" }} className={linkClass} onClick={close}>{t("resources")}</Link>
          <Link href="/a-propos" className={linkClass} onClick={close}>{t("about")}</Link>
          <a href="#contact" className={linkClass} onClick={close}>{t("contact")}</a>
          <LanguageSwitcher />
          <Link href="/referencer-un-praticien" className={btnPrimary} onClick={close}>{t("cta")}</Link>
        </nav>
      </div>
    </header>
  );
}
