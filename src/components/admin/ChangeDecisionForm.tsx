"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnGhost, btnPrimary } from "@/lib/ui";

export default function ChangeDecisionForm({ id }: { id: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function send(action: "approve" | "reject") {
    if (action === "reject" && note.trim().length < 10) {
      setMessage("Indiquez un motif d’au moins 10 caractères.");
      return;
    }
    if (!window.confirm(action === "approve" ? "Appliquer ces modifications au profil public ?" : "Refuser cette demande de modification ?")) return;
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/admin/changes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, note }),
    });
    if (res.ok) {
      router.push("/admin/modifications");
      router.refresh();
      return;
    }
    setMessage("Action impossible. Reconnectez-vous ou réessayez.");
    setBusy(false);
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-6">
      <h2 className="mb-2 font-serif text-xl font-bold">Décision</h2>
      <label htmlFor="note" className="block text-sm font-semibold">Message (obligatoire pour refuser, affiché à la personne)</label>
      <textarea id="note" rows={3} maxLength={1000} className="mt-1 w-full rounded-xl border border-line bg-white px-4 py-3 text-base" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} disabled={busy} onClick={() => send("approve")}>Approuver et appliquer</button>
        <button type="button" className={btnGhost} disabled={busy} onClick={() => send("reject")}>Refuser</button>
      </div>
      {message && <p role="alert" className="mt-3 text-sm">{message}</p>}
    </section>
  );
}
