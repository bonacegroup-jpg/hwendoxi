"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { btnPrimary, container } from "@/lib/ui";
import LanguageSwitcher from "./LanguageSwitcher";

const links = [
  { href: "#annuaire", key: "directory" },
  { href: "#ressources", key: "resources" },
  { href: "#piliers", key: "about" },
  { href: "#contact", key: "contact" },
] as const;

export default function SiteHeader() {
  const t = useTranslations("Header");
  const [open, setOpen] = useState(false);

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
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-[15px] hover:text-gold-dark" onClick={() => setOpen(false)}>
              {t(l.key)}
            </a>
          ))}
          <LanguageSwitcher />
          <a href="#referencer" className={btnPrimary} onClick={() => setOpen(false)}>
            {t("cta")}
          </a>
        </nav>
      </div>
    </header>
  );
}
