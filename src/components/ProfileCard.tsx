"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { PractitionerCard } from "@/lib/types";
import { btnGhost } from "@/lib/ui";
import Avatar from "./Avatar";

export default function ProfileCard({ p }: { p: PractitionerCard }) {
  const t = useTranslations("Directory");
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const place = `${p.country} · ${p.city}${p.specialty ? ` — ${p.specialty}` : ""}`;

  return (
    <article className="rounded-2xl border border-line bg-white p-5">
      <div className="mb-3 flex items-center gap-3">
        <Avatar name={p.name} photoUrl={p.photoUrl} size={64} />
        <div>
          <h3 className="font-serif text-lg font-bold leading-tight">{p.name}</h3>
          <p className="text-sm font-semibold">{p.title}</p>
        </div>
      </div>

      <p className="mb-2 text-sm text-muted">{place}</p>
      <span className="mb-3 inline-block rounded-full border border-forest px-2.5 py-0.5 text-xs font-semibold text-forest">
        {t(`levels.${p.level}`)}
      </span>

      <div id={panelId} hidden={!open} className="mb-3 border-t border-dashed border-line pt-3 text-sm">
        {p.years !== null && <p>{t("years", { years: p.years })}</p>}
        <p>{p.phone ? t("phonePublic", { phone: p.phone }) : t("phoneHidden")}</p>
        <Link href={`/annuaire/praticiens/${p.slug}`} className="mt-2 inline-block font-semibold text-gold-dark underline">
          {t("viewProfile")}
        </Link>
      </div>

      <button type="button" className={btnGhost} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
        {open ? t("reduce") : t("discover")}
      </button>
    </article>
  );
}
