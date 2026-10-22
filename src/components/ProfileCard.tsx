"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import type { PractitionerCard } from "@/lib/types";
import { btnGhost } from "@/lib/ui";

export default function ProfileCard({ p }: { p: PractitionerCard }) {
  const t = useTranslations("Directory");
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const initials = p.name.split(" ").map((w) => w[0]).join("");
  const place = `${p.country} · ${p.city}${p.specialty ? ` — ${p.specialty}` : ""}`;

  return (
    <article className="rounded-2xl border border-line bg-white p-5">
      <div className="mb-2 flex items-center gap-3">
        <div aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-gold bg-sand font-serif font-bold text-gold-dark">
          {initials}
        </div>
        <div>
          <h3 className="font-serif text-lg font-bold leading-tight">{p.name}</h3>
          {p.spiritualName && <p className="text-sm text-muted">{p.spiritualName}</p>}
        </div>
      </div>

      <p className="font-semibold">{p.title}</p>
      <p className="mb-2 text-sm text-muted">{place}</p>
      <span className="mb-3 inline-block rounded-full border border-forest px-2.5 py-0.5 text-xs font-semibold text-forest">
        {t(`levels.${p.level}`)}
      </span>

      <div id={panelId} hidden={!open} className="mb-3 border-t border-dashed border-line pt-3 text-sm">
        {p.years !== null && <p>{t("years", { years: p.years })}</p>}
        <p>{p.phone ? t("phonePublic", { phone: p.phone }) : t("phoneHidden")}</p>
        <p className="mt-1 text-muted">{t("fullProfileSoon")}</p>
      </div>

      <button type="button" className={btnGhost} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
        {open ? t("reduce") : t("discover")}
      </button>
    </article>
  );
}
