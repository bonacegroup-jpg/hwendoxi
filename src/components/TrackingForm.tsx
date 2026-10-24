"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { btnPrimary } from "@/lib/ui";

type Result = { status: string; submittedAt: string } | "not_found" | "error" | null;
const field = "w-full rounded-xl border border-line bg-white px-4 py-3 text-base";

export default function TrackingForm() {
  const t = useTranslations("Tracking");
  const locale = useLocale();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/referencing/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.status === 404) setResult("not_found");
      else if (!res.ok) setResult("error");
      else setResult((await res.json()) as { status: string; submittedAt: string });
    } catch {
      setResult("error");
    }
    setBusy(false);
  }

  const message =
    result === null ? ""
    : result === "not_found" ? t("notFound")
    : result === "error" ? t("error")
    : `${t(`status.${result.status}`)} — ${t("submittedOn", { date: new Date(result.submittedAt).toLocaleDateString(locale) })}`;

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-md space-y-3 rounded-2xl border border-line bg-white p-6">
      <label htmlFor="code" className="block text-sm font-semibold">{t("codeLabel")}</label>
      <input id="code" required className={field} placeholder="HWX-XXXXXXXX" value={code} onChange={(e) => setCode(e.target.value)} />
      <button type="submit" className={btnPrimary} disabled={busy}>{t("check")}</button>
      <p role="status" aria-live="polite" className="text-sm">{message}</p>
      <Link href="/referencer-un-praticien/modifier" className="inline-block text-sm font-semibold text-gold-dark underline">{t("editLink")}</Link>
    </form>
  );
}
