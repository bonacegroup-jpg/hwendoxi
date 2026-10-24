"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { AccessResponse } from "@/lib/edit-types";
import { prepareFile } from "@/lib/image-client";
import type { CategoryOption } from "@/lib/types";
import { btnPrimary } from "@/lib/ui";

const field = "w-full rounded-xl border border-line bg-white px-4 py-3 text-base";
const lab = "mb-1 mt-4 block text-sm font-semibold";
const check = "mt-3 flex items-start gap-3 text-sm";

type Stage = "access" | "form" | "done";

export default function EditProfile({ categories }: { categories: CategoryOption[] }) {
  const t = useTranslations("Edit");
  const f = useTranslations("Form");
  const tr = useTranslations("Tracking");
  const formRef = useRef<HTMLFormElement>(null);
  const [stage, setStage] = useState<Stage>("access");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [access, setAccess] = useState<AccessResponse | null>(null);
  const [mode, setMode] = useState<"resubmitted" | "change_requested">("resubmitted");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function open(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/referencing/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email }),
      });
      if (res.ok) {
        setAccess((await res.json()) as AccessResponse);
        setStage("form");
      } else {
        setError(res.status === 404 ? t("wrongCredentials") : f("errGeneric"));
      }
    } catch {
      setError(f("errGeneric"));
    }
    setBusy(false);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current || !access) return;
    setBusy(true);
    setError("");
    const fd = new FormData(formRef.current);
    for (const name of ["photo", "idDoc"]) {
      const file = fd.get(name);
      if (file instanceof File && file.size > 0) {
        const prepared = await prepareFile(file);
        if (!prepared) {
          setError(f("errFile"));
          setBusy(false);
          return;
        }
        fd.set(name, prepared, prepared.name);
      } else {
        fd.delete(name);
      }
    }
    fd.set("code", code);
    fd.set("email", email);
    try {
      const res = await fetch("/api/referencing/update", { method: "POST", body: fd });
      if (res.ok) {
        setMode(((await res.json()) as { mode: "resubmitted" | "change_requested" }).mode);
        setStage("done");
        window.scrollTo({ top: 0 });
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          res.status === 413 ? f("errTooLarge")
          : data.error === "invalid_file" ? f("errFile")
          : data.error === "photo_rights" ? f("errPhotoRights")
          : data.error === "invalid_field" ? f("errInvalid")
          : data.error === "request_pending" ? t("errPending")
          : data.error === "not_editable" ? t("errNotEditable")
          : f("errGeneric"),
        );
      }
    } catch {
      setError(f("errGeneric"));
    }
    setBusy(false);
  }

  if (stage === "done") {
    return (
      <div className="rounded-2xl border-2 border-forest bg-white p-6" role="status">
        <p>{mode === "resubmitted" ? t("doneResubmitted") : t("doneChange")}</p>
      </div>
    );
  }

  if (stage === "access" || !access) {
    return (
      <form onSubmit={open} className="max-w-md space-y-3 rounded-2xl border border-line bg-white p-6">
        <label htmlFor="code" className="block text-sm font-semibold">{t("codeLabel")}</label>
        <input id="code" required className={field} placeholder="HWX-XXXXXXXX" value={code} onChange={(e) => setCode(e.target.value)} />
        <label htmlFor="email" className="block text-sm font-semibold">{t("emailLabel")}</label>
        <input id="email" type="email" required className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
        {error && <p role="alert" className="text-sm">{error}</p>}
        <button type="submit" className={btnPrimary} disabled={busy}>{t("open")}</button>
        <p className="text-xs text-muted">{t("lostCode")}</p>
      </form>
    );
  }

  const p = access.profile;
  const approved = access.status === "approved";
  const pub = new Set(p.pub);

  return (
    <div>
      <div className="mb-4 rounded-2xl border border-line bg-white p-5">
        <p className="text-sm">{t("statusLabel")} : <strong>{tr(`status.${access.status}`)}</strong></p>
        {access.message && (
          <p className="mt-3 rounded-xl bg-sand p-3 text-sm"><strong>{t("committeeMessage")} :</strong> <span className="whitespace-pre-line">{access.message}</span></p>
        )}
        {!access.canEdit && <p className="mt-3 text-sm">{t("cannotEdit")}</p>}
        {access.canEdit && access.pendingChange && <p className="mt-3 text-sm">{t("pendingChange")}</p>}
        {access.canEdit && !access.pendingChange && <p className="mt-3 text-sm text-muted">{approved ? t("noticeApproved") : t("noticePending")}</p>}
      </div>

      {access.canEdit && !access.pendingChange && (
        <form ref={formRef} onSubmit={submit} className="rounded-2xl border border-line bg-white p-6">
          {approved ? (
            <p className="rounded-xl bg-sand p-3 text-sm">{t("civilLocked")}</p>
          ) : (
            <>
              <label htmlFor="firstName" className={lab}>{f("firstName")}</label>
              <input id="firstName" name="firstName" required maxLength={80} defaultValue={p.firstName} className={field} />
              <label htmlFor="lastName" className={lab}>{f("lastName")}</label>
              <input id="lastName" name="lastName" required maxLength={80} defaultValue={p.lastName} className={field} />
            </>
          )}

          <label htmlFor="spiritualName" className={lab}>{f("spiritualName")}</label>
          <input id="spiritualName" name="spiritualName" required minLength={2} maxLength={120} defaultValue={p.spiritualName} className={field} />
          <label htmlFor="title" className={lab}>{f("jobTitle")}</label>
          <input id="title" name="title" required maxLength={120} defaultValue={p.title} className={field} />
          <label htmlFor="category" className={lab}>{f("category")}</label>
          <select id="category" name="category" required defaultValue={p.categoryId} className={field}>
            <option value="" disabled>{f("chooseCategory")}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label htmlFor="specialty" className={lab}>{f("specialty")}</label>
          <input id="specialty" name="specialty" required maxLength={200} defaultValue={p.specialty} className={field} />
          <p className="mt-1 text-xs text-muted">{f("specialtyHelp")}</p>
          <label htmlFor="years" className={lab}>{f("years")}</label>
          <input id="years" name="years" type="number" min={0} max={80} required defaultValue={p.years ?? ""} className={field} />
          <label htmlFor="bio" className={lab}>{f("bio")}</label>
          <textarea id="bio" name="bio" required minLength={30} maxLength={2000} rows={6} defaultValue={p.bio} className={field} />
          <label htmlFor="country" className={lab}>{f("country")}</label>
          <input id="country" name="country" required maxLength={60} defaultValue={p.country} className={field} />
          <label htmlFor="city" className={lab}>{f("city")}</label>
          <input id="city" name="city" required maxLength={80} defaultValue={p.city} className={field} />

          <label htmlFor="phone" className={lab}>{f("phone")}</label>
          <input id="phone" name="phone" type="tel" required maxLength={30} defaultValue={p.phone} className={field} />
          <label htmlFor="whatsapp" className={lab}>{f("whatsapp")} <span className="font-normal text-muted">({f("optional")})</span></label>
          <input id="whatsapp" name="whatsapp" type="tel" maxLength={30} defaultValue={p.whatsapp} className={field} />
          {(["facebook", "instagram", "tiktok", "x", "website"] as const).map((k) => (
            <div key={k}>
              <label htmlFor={k} className={lab}>{f(k)} <span className="font-normal text-muted">({f("optional")})</span></label>
              <input id={k} name={k} type="url" maxLength={200} defaultValue={p[k]} placeholder="https://…" className={field} />
            </div>
          ))}

          <label htmlFor="photo" className={lab}>{t("newPhoto")}</label>
          <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className={field} />
          {!approved && (
            <>
              <label htmlFor="idDoc" className={lab}>{t("newId")}</label>
              <input id="idDoc" name="idDoc" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className={field} />
              <p className="mt-1 text-xs text-muted">{f("fileHelp")}</p>
            </>
          )}

          <p className="mt-5 font-semibold">{f("publishIntro")}</p>
          {(["photo", "phone", "whatsapp", "social"] as const).map((k) => (
            <label key={k} className={check}>
              <input type="checkbox" name="pub" value={k} defaultChecked={pub.has(k)} className="mt-1" />
              {f(`pub${k[0].toUpperCase()}${k.slice(1)}`)}
            </label>
          ))}
          <p className="mt-2 text-xs text-muted">{f("pubNote")}</p>
          <label className={check}><input type="checkbox" name="accuracy" required className="mt-1" />{f("accAccuracy")}</label>
          <label className={check}><input type="checkbox" name="photoRights" className="mt-1" />{f("accPhotoRights")}</label>
          <div aria-hidden="true" className="hidden"><input name="company" tabIndex={-1} autoComplete="off" /></div>

          {error && <p role="alert" className="mt-4 rounded-xl border border-line bg-sand p-3 text-sm">{error}</p>}
          <button type="submit" className={`${btnPrimary} mt-6`} disabled={busy}>{approved ? t("sendChange") : t("sendPending")}</button>
        </form>
      )}
    </div>
  );
}
