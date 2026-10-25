"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { btnGhost } from "@/lib/ui";
import Turnstile, { turnstileEnabled } from "./Turnstile";

type Status = "idle" | "sending" | "done" | "error";
const field = "w-full rounded-xl border border-line bg-white px-4 py-3 text-base";

export default function ReportForm({ practitionerId }: { practitionerId: string }) {
  const t = useTranslations("Profile");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState(""); // champ piège invisible : seuls les robots le remplissent
  const [status, setStatus] = useState<Status>("idle");
  const [token, setToken] = useState("");
  const [widgetKey, setWidgetKey] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: practitionerId, message, email, website: trap, turnstile: token }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
    setToken("");
    setWidgetKey((k) => k + 1);
  }

  return (
    <details className="mt-8 rounded-2xl border border-line bg-white p-5">
      <summary className="cursor-pointer font-semibold">{t("reportTitle")}</summary>
      {status === "done" ? (
        <p className="mt-3" role="status">{t("reportThanks")}</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-3 space-y-3">
          <p className="text-sm text-muted">{t("reportHelp")}</p>
          <label htmlFor="rp-msg" className="block text-sm font-semibold">{t("reportMessage")}</label>
          <textarea id="rp-msg" required minLength={10} maxLength={2000} rows={4} className={field}
            value={message} onChange={(e) => setMessage(e.target.value)} />
          <label htmlFor="rp-mail" className="block text-sm font-semibold">{t("reportEmail")}</label>
          <input id="rp-mail" type="email" maxLength={200} className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
          <div aria-hidden="true" className="hidden">
            <input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
          </div>
          <Turnstile key={widgetKey} onToken={setToken} />
          <button type="submit" className={btnGhost} disabled={status === "sending" || (turnstileEnabled && !token)}>
            {status === "sending" ? t("reportSending") : t("reportSend")}
          </button>
          {status === "error" && <p role="alert" className="text-sm">{t("reportError")}</p>}
        </form>
      )}
    </details>
  );
}
