"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { CategoryOption } from "@/lib/types";
import { btnGhost, btnPrimary } from "@/lib/ui";
import Turnstile, { turnstileEnabled } from "./Turnstile";

const field = "w-full rounded-xl border border-line bg-white px-4 py-3 text-base";
const lab = "mb-1 mt-4 block text-sm font-semibold";
const check = "mt-3 flex items-start gap-3 text-sm";
const MAX_SIDE = 1600;

// Réduit les photos (téléphone) avant l'envoi ; refuse les fichiers trop lourds ou non pris en charge.
async function prepare(file: File): Promise<File | null> {
  if (file.type === "application/pdf") return file.size <= 2_500_000 ? file : null;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return null;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file.size <= 1_500_000 ? file : null;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.8));
    return blob ? new File([blob], "image.jpg", { type: "image/jpeg" }) : null;
  } catch {
    return file.size <= 1_500_000 ? file : null;
  }
}

type Summary = { name: string; spiritual: string; place: string; title: string; published: string[] };

export default function ReferencingForm({ categories }: { categories: CategoryOption[] }) {
  const t = useTranslations("Form");
  const formRef = useRef<HTMLFormElement>(null);
  const startedAt = useRef(0);
  const [step, setStep] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [widgetKey, setWidgetKey] = useState(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const titles = [t("step1"), t("step2"), t("step3"), t("step4"), t("step5")];

  function next() {
    const form = formRef.current;
    const fs = form?.querySelector<HTMLFieldSetElement>(`fieldset[data-step="${step}"]`);
    if (!form || !fs) return;
    const controls = Array.from(fs.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea"));
    for (const el of controls) {
      if (!el.checkValidity()) {
        el.reportValidity();
        return;
      }
    }
    if (step === 3) {
      const fd = new FormData(form);
      const get = (k: string) => String(fd.get(k) ?? "");
      const labels: Record<string, string> = { photo: t("pubPhoto"), phone: t("pubPhone"), whatsapp: t("pubWhatsapp"), social: t("pubSocial") };
      setSummary({
        name: `${get("firstName")} ${get("lastName")}`,
        spiritual: get("spiritualName"),
        place: `${get("city")}, ${get("country")}`,
        title: get("title"),
        published: fd.getAll("pub").map((v) => labels[String(v)] ?? String(v)),
      });
    }
    setError("");
    setStep((s) => s + 1);
    window.scrollTo({ top: 0 });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;
    setBusy(true);
    setError("");
    const fd = new FormData(formRef.current);
    for (const name of ["photo", "idDoc", "memberCard"]) {
      const f = fd.get(name);
      if (f instanceof File && f.size > 0) {
        const p = await prepare(f);
        if (!p) {
          setError(t("errFile"));
          setBusy(false);
          return;
        }
        fd.set(name, p, p.name);
      } else {
        fd.delete(name);
      }
    }
    fd.set("startedAt", String(startedAt.current));
    fd.set("cf-turnstile-response", token);
    try {
      const res = await fetch("/api/referencing", { method: "POST", body: fd });
      if (res.ok) {
        setCode(((await res.json()) as { code: string }).code);
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          res.status === 429 ? t("errTooMany")
          : res.status === 413 ? t("errTooLarge")
          : data.error === "invalid_file" ? t("errFile")
          : data.error === "bot_check" ? t("errBot")
          : data.error === "photo_rights" ? t("errPhotoRights")
          : data.error === "invalid_field" ? t("errInvalid")
          : t("errGeneric"),
        );
      }
    } catch {
      setError(t("errGeneric"));
    }
    setBusy(false);
    setToken("");
    setWidgetKey((k) => k + 1);
  }

  if (code) {
    return (
      <div className="rounded-2xl border-2 border-forest bg-white p-6">
        <h2 className="font-serif text-2xl font-bold">{t("doneTitle")}</h2>
        <p className="mt-3">{t("doneText")}</p>
        <p className="mt-3">{t("codeLabel")} <code className="rounded bg-sand px-2 py-1 text-lg font-bold">{code}</code></p>
        <p className="mt-2 text-sm text-muted">{t("codeNote")}</p>
        <Link href="/referencer-un-praticien/suivi" className={`${btnGhost} mt-4`}>{t("trackLink")}</Link>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="rounded-2xl border border-line bg-white p-6">
      <p className="font-semibold">{t("stepOf", { step: step + 1, title: titles[step] })}</p>
      <div className="mb-4 mt-2 h-2 overflow-hidden rounded bg-sand"><div className="h-full bg-gold" style={{ width: `${(step + 1) * 20}%` }} /></div>

      <fieldset data-step="0" hidden={step !== 0}>
        <legend className="mb-2 font-serif text-xl font-bold">{titles[0]}</legend>
        <p className="rounded-xl bg-sand p-3 text-sm">{t("civilHelp")}</p>
        <label htmlFor="firstName" className={lab}>{t("firstName")}</label>
        <input id="firstName" name="firstName" required maxLength={80} autoComplete="given-name" className={field} />
        <label htmlFor="lastName" className={lab}>{t("lastName")}</label>
        <input id="lastName" name="lastName" required maxLength={80} autoComplete="family-name" className={field} />
        <label htmlFor="spiritualName" className={lab}>{t("spiritualName")}</label>
        <input id="spiritualName" name="spiritualName" required minLength={2} maxLength={120} className={field} />
        <p className="mt-1 text-xs text-muted">{t("spiritualNameHelp")}</p>
        <label htmlFor="photo" className={lab}>{t("photo")} <span className="font-normal text-muted">({t("optional")})</span></label>
        <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className={field} />
        <label htmlFor="country" className={lab}>{t("country")}</label>
        <input id="country" name="country" required maxLength={60} list="pays" className={field} />
        <datalist id="pays"><option value="Bénin" /><option value="Togo" /><option value="Nigeria" /><option value="Ghana" /></datalist>
        <label htmlFor="city" className={lab}>{t("city")}</label>
        <input id="city" name="city" required maxLength={80} className={field} />
      </fieldset>

      <fieldset data-step="1" hidden={step !== 1}>
        <legend className="mb-2 font-serif text-xl font-bold">{titles[1]}</legend>
        <label htmlFor="title" className={lab}>{t("jobTitle")}</label>
        <input id="title" name="title" required maxLength={120} className={field} />
        <label htmlFor="category" className={lab}>{t("category")}</label>
        <select id="category" name="category" required className={field} defaultValue="">
          <option value="" disabled>{t("chooseCategory")}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label htmlFor="tradition" className={lab}>{t("tradition")}</label>
        <input id="tradition" name="tradition" required maxLength={120} className={field} />
        <label htmlFor="specialty" className={lab}>{t("specialty")}</label>
        <input id="specialty" name="specialty" required maxLength={200} className={field} />
        <p className="mt-1 text-xs text-muted">{t("specialtyHelp")}</p>
        <label htmlFor="years" className={lab}>{t("years")}</label>
        <input id="years" name="years" type="number" min={0} max={80} required className={field} />
        <label htmlFor="bio" className={lab}>{t("bio")}</label>
        <textarea id="bio" name="bio" required minLength={30} maxLength={2000} rows={5} className={field} />
        <label htmlFor="deities" className={lab}>{t("deities")} <span className="font-normal text-muted">({t("optional")})</span></label>
        <input id="deities" name="deities" maxLength={200} className={field} />
      </fieldset>

      <fieldset data-step="2" hidden={step !== 2}>
        <legend className="mb-2 font-serif text-xl font-bold">{titles[2]}</legend>
        <label htmlFor="email" className={lab}>{t("email")}</label>
        <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" className={field} />
        <p className="mt-1 text-xs text-muted">{t("emailHelp")}</p>
        <label htmlFor="phone" className={lab}>{t("phone")}</label>
        <input id="phone" name="phone" type="tel" required maxLength={30} placeholder="+229 …" className={field} />
        <label htmlFor="whatsapp" className={lab}>{t("whatsapp")} <span className="font-normal text-muted">({t("optional")})</span></label>
        <input id="whatsapp" name="whatsapp" type="tel" maxLength={30} className={field} />
        <p className="mt-4 text-sm text-muted">{t("socialIntro")}</p>
        {(["facebook", "instagram", "tiktok", "x", "website"] as const).map((k) => (
          <div key={k}>
            <label htmlFor={k} className={lab}>{t(k)}</label>
            <input id={k} name={k} type="url" maxLength={200} placeholder="https://…" className={field} />
          </div>
        ))}
      </fieldset>

      <fieldset data-step="3" hidden={step !== 3}>
        <legend className="mb-2 font-serif text-xl font-bold">{titles[3]}</legend>
        <p className="rounded-xl bg-sand p-3 text-sm">{t("idNotice")}</p>
        <label htmlFor="idDoc" className={lab}>{t("idDoc")}</label>
        <input id="idDoc" name="idDoc" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" className={field} />
        <label htmlFor="memberCard" className={lab}>{t("memberCard")} <span className="font-normal text-muted">({t("optional")})</span></label>
        <input id="memberCard" name="memberCard" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className={field} />
        <p className="mt-1 text-xs text-muted">{t("fileHelp")}</p>
        <p className="mt-5 font-semibold">{t("publishIntro")}</p>
        {(["photo", "phone", "whatsapp", "social"] as const).map((k) => (
          <label key={k} className={check}><input type="checkbox" name="pub" value={k} className="mt-1" />{t(`pub${k[0].toUpperCase()}${k.slice(1)}`)}</label>
        ))}
        <p className="mt-2 text-xs text-muted">{t("pubNote")}</p>
        <label className={check}><input type="checkbox" name="terms" required className="mt-1" />{t("accTerms")}</label>
        <label className={check}><input type="checkbox" name="privacy" required className="mt-1" />{t("accPrivacy")}</label>
        <label className={check}><input type="checkbox" name="accuracy" required className="mt-1" />{t("accAccuracy")}</label>
        <label className={check}><input type="checkbox" name="photoRights" className="mt-1" />{t("accPhotoRights")}</label>
      </fieldset>

      <fieldset data-step="4" hidden={step !== 4}>
        <legend className="mb-2 font-serif text-xl font-bold">{titles[4]}</legend>
        {summary && (
          <dl className="grid gap-x-4 gap-y-2 text-sm md:grid-cols-[200px_1fr]">
            <dt className="text-muted">{t("rName")}</dt><dd>{summary.name}</dd>
            <dt className="text-muted">{t("rSpiritual")}</dt><dd>{summary.spiritual || "—"}</dd>
            <dt className="text-muted">{t("rPlace")}</dt><dd>{summary.place}</dd>
            <dt className="text-muted">{t("rTitle")}</dt><dd>{summary.title}</dd>
            <dt className="text-muted">{t("rPublished")}</dt><dd>{summary.published.length ? summary.published.join(", ") : t("rNone")}</dd>
          </dl>
        )}
        <p className="mt-4 rounded-xl bg-sand p-3 text-sm">{t("sendNotice")}</p>
        {step === 4 && <Turnstile key={widgetKey} onToken={setToken} />}
        <div aria-hidden="true" className="hidden"><input name="company" tabIndex={-1} autoComplete="off" /></div>
      </fieldset>

      {error && <p role="alert" className="mt-4 rounded-xl border border-line bg-sand p-3 text-sm">{error}</p>}

      <div className="mt-6 flex justify-between gap-3">
        <button type="button" className={btnGhost} onClick={() => setStep((s) => s - 1)} hidden={step === 0}>{t("previous")}</button>
        {step < 4 ? (
          <button type="button" className={btnPrimary} onClick={next}>{t("next")}</button>
        ) : (
          <button type="submit" className={btnPrimary} disabled={busy || (turnstileEnabled && !token)}>{busy ? t("sending") : t("send")}</button>
        )}
      </div>
    </form>
  );
}
