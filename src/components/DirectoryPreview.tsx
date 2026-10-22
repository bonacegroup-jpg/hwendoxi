"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { CategoryOption, PractitionerCard, SearchResponse } from "@/lib/types";
import { btnGhost, container } from "@/lib/ui";
import ProfileCard from "./ProfileCard";

type Status = "loading" | "ready" | "error";

const field = "w-full rounded-xl border border-line bg-white px-4 py-3 text-base";

export default function DirectoryPreview({
  categories,
  countries,
}: {
  categories: CategoryOption[];
  countries: string[];
}) {
  const t = useTranslations("Directory");
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<PractitionerCard[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(6);
  const [status, setStatus] = useState<Status>("loading");

  // Recherche dans la base (via /api/practitioners), avec un court délai pendant la frappe
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      const params = new URLSearchParams({ page: String(page) });
      if (query.trim()) params.set("q", query.trim());
      if (country) params.set("country", country);
      if (category) params.set("category", category);
      if (level) params.set("level", level);
      try {
        const res = await fetch(`/api/practitioners?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) throw new Error("search_failed");
        const data = (await res.json()) as SearchResponse;
        setItems(data.items);
        setTotal(data.total);
        setPageSize(data.pageSize);
        setStatus("ready");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, country, category, level, page]);

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const summary = `${t("count", { count: total })} ${t("noFraud")}`;
  const reset = () => {
    setQuery("");
    setCountry("");
    setCategory("");
    setLevel("");
    setPage(1);
  };

  return (
    <section id="annuaire" className="bg-sand py-12">
      <div className={container}>
        <h2 className="mb-4 font-serif text-2xl font-bold">{t("title")}</h2>

        <div className="mb-3 grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <div>
            <label htmlFor="recherche" className="sr-only">{t("searchLabel")}</label>
            <input id="recherche" type="search" value={query} placeholder={t("placeholder")} className={field}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label htmlFor="f-pays" className="sr-only">{t("country")}</label>
            <select id="f-pays" value={country} className={field} onChange={(e) => { setCountry(e.target.value); setPage(1); }}>
              <option value="">{t("allCountries")}</option>
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-cat" className="sr-only">{t("category")}</label>
            <select id="f-cat" value={category} className={field} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
              <option value="">{t("allCategories")}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-niv" className="sr-only">{t("level")}</label>
            <select id="f-niv" value={level} className={field} onChange={(e) => { setLevel(e.target.value); setPage(1); }}>
              <option value="">{t("allLevels")}</option>
              <option value="1">{t("levels.1")}</option>
              <option value="2">{t("levels.2")}</option>
              <option value="3">{t("levels.3")}</option>
            </select>
          </div>
          <button type="button" className={btnGhost} onClick={reset}>{t("reset")}</button>
        </div>

        <p className="mb-6 text-sm text-muted" aria-live="polite">
          {status === "loading" ? t("loading") : status === "error" ? t("error") : summary}
        </p>

        {status === "ready" && items.length === 0 ? (
          <p>{t("noResults")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {items.map((p) => <ProfileCard key={p.id} p={p} />)}
          </div>
        )}

        {pages > 1 && (
          <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Pagination">
            <button type="button" className={btnGhost} disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>{t("previous")}</button>
            <span className="text-sm">{t("pageOf", { page, pages })}</span>
            <button type="button" className={btnGhost} disabled={page >= pages} onClick={() => setPage((n) => n + 1)}>{t("next")}</button>
          </nav>
        )}

        <p className="mt-6 text-sm text-muted">{t("disclaimer")}</p>
      </div>
    </section>
  );
}
