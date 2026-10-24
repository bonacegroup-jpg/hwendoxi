"use client";

import { useState } from "react";
import { btnGhost } from "@/lib/ui";

export default function TrackingCodeButton({ id }: { id: string }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function generate() {
    if (!window.confirm("Générer un nouveau code de suivi ? L’ancien code ne fonctionnera plus. Faites-le seulement après avoir vérifié l’identité de la personne.")) return;
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/admin/tracking-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) setCode(((await res.json()) as { code: string }).code);
    else setMessage("Génération impossible.");
    setBusy(false);
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-6">
      <h2 className="mb-2 font-serif text-xl font-bold">Code de suivi perdu</h2>
      <p className="mb-3 text-sm text-muted">Pour un praticien qui a perdu son code et doit modifier son profil.</p>
      <button type="button" className={btnGhost} disabled={busy} onClick={generate}>Générer un nouveau code</button>
      {code && (
        <p className="mt-3 text-sm" role="status">
          Nouveau code (affiché une seule fois, transmettez-le à la personne par un canal sûr) :
          <code className="mt-1 block w-fit rounded bg-sand px-2 py-1 text-lg font-bold">{code}</code>
        </p>
      )}
      {message && <p role="alert" className="mt-3 text-sm">{message}</p>}
    </section>
  );
}
