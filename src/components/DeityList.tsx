"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";

export type DeityItem = { slug: string; name: string; otherNames: string[]; tradition: string; region: string | null; excerpt: string; imageUrl: string | null };

const field = "w-full rounded-xl border border-line bg-white px-4 py-3 text-base";
const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

export default function DeityList({ items, traditions }: { items: DeityItem[]; traditions: string[] }) {
  const t = useTranslations("Deities");
  const [query, setQuery] = useState("");
  const [tradition, setTradition] = useState("");

  const results = useMemo(() => {
    const q = normalize(query);
    return items.filter((d) => {
      const text = normalize([d.name, ...d.otherNames, d.tradition, d.region ?? ""].join(" "));
      return (!q || text.includes(q)) && (!tradition || d.tradition === tradition);
    });
  }, [items, query, tradition]);

  return (
    <div>
      <div className="mb-3 grid gap-3 md:grid-cols-[2fr_1fr]">
        <div>
          <label htmlFor="d-search" className="sr-only">{t("searchLabel")}</label>
          <input id="d-search" type="search" className={field} placeholder={t("placeholder")} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div>
          <label htmlFor="d-trad" className="sr-only">{t("tradition")}</label>
          <select id="d-trad" className={field} value={tradition} onChange={(e) => setTradition(e.target.value)}>
            <option value="">{t("allTraditions")}</option>
            {traditions.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
      </div>
      <p className="mb-6 text-sm text-muted" aria-live="polite">{t("count", { count: results.length })}</p>

      {results.length === 0 ? (
        <p>{items.length === 0 ? t("empty") : t("noResults")}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {results.map((d) => (
            <article key={d.slug} className="overflow-hidden rounded-2xl border border-line bg-white">
              {d.imageUrl && <Image src={d.imageUrl} alt="" width={640} height={360} className="h-44 w-full object-cover" />}
              <div className="p-5">
              <h2 className="font-serif text-lg font-bold leading-tight">{d.name}</h2>
              {d.otherNames.length > 0 && <p className="text-sm text-muted">{d.otherNames.join(", ")}</p>}
              <p className="mt-2 text-sm font-semibold">{d.tradition}{d.region ? ` · ${d.region}` : ""}</p>
              {d.excerpt && <p className="mt-2 text-sm text-muted">{d.excerpt}</p>}
              <Link href={`/annuaire/divinites/${d.slug}`} className="mt-3 inline-block font-semibold text-gold-dark underline">{t("view")}</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
