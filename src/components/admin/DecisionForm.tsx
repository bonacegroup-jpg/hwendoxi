"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnGhost, btnPrimary } from "@/lib/ui";

type Action = "approve" | "fix" | "reject" | "suspend";
const field = "w-full rounded-xl border border-line bg-white px-4 py-3 text-base";

export default function DecisionForm({ id, status, hasMemberCard }: { id: string; status: string; hasMemberCard: boolean }) {
  const router = useRouter();
  const [level, setLevel] = useState("1");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const open = status === "pending" || status === "needs_changes";
  if (!open && status !== "approved") {
    return <section className="rounded-2xl border border-line bg-white p-6 text-sm text-muted">Aucune action disponible pour ce statut.</section>;
  }

  async function send(action: Action) {
    if (action !== "approve" && note.trim().length < 10) {
      setMessage("Indiquez un motif d’au moins 10 caractères.");
      return;
    }
    const labels: Record<Action, string> = {
      approve: "Valider et publier ce profil ? Les pièces seront supprimées.",
      fix: "Demander des corrections ?",
      reject: "Refuser ce dossier ? Les pièces seront supprimées.",
      suspend: "Suspendre ce profil ? Il disparaîtra de l’annuaire.",
    };
    if (!window.confirm(labels[action])) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, level: Number(level), note }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setNote("");
        router.refresh();
      } else {
        setMessage(data.error === "member_card_required" ? "Le niveau 2 exige une carte de membre ou attestation." : "Action impossible. Vérifiez la saisie ou reconnectez-vous.");
      }
    } catch {
      setMessage("Erreur réseau. Réessayez.");
    }
    setBusy(false);
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-6">
      <h2 className="mb-2 font-serif text-xl font-bold">Décision</h2>
      {open && (
        <>
          <label htmlFor="lvl" className="block text-sm font-semibold">Niveau de vérification à attribuer</label>
          <select id="lvl" className={`${field} mb-3 mt-1`} value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="1">1 — Identité examinée</option>
            <option value="2" disabled={!hasMemberCard}>2 — Appartenance documentée{hasMemberCard ? "" : " (carte requise)"}</option>
            <option value="3">3 — Dossier approfondi</option>
          </select>
          <button type="button" className={btnPrimary} disabled={busy} onClick={() => send("approve")}>Valider et publier</button>
        </>
      )}
      <label htmlFor="note" className="mt-5 block text-sm font-semibold">Motif ou message (obligatoire sauf pour valider)</label>
      <textarea id="note" rows={3} maxLength={1000} className={`${field} mt-1`} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="mt-3 flex flex-wrap gap-2">
        {open && <button type="button" className={btnGhost} disabled={busy} onClick={() => send("fix")}>Demander des corrections</button>}
        {open && <button type="button" className={btnGhost} disabled={busy} onClick={() => send("reject")}>Refuser</button>}
        {status === "approved" && <button type="button" className={btnGhost} disabled={busy} onClick={() => send("suspend")}>Suspendre le profil</button>}
      </div>
      {message && <p role="alert" className="mt-3 text-sm">{message}</p>}
      <p className="mt-3 text-xs text-muted">Le motif est conservé dans les notes internes et le journal d’audit. Aucun e-mail n’est envoyé automatiquement : contactez la personne à l’adresse indiquée si nécessaire.</p>
    </section>
  );
}
