"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnGhost, btnPrimary } from "@/lib/ui";

export type VideoValues = {
  id?: string;
  youtubeUrl: string;
  titleFr: string; titleEn: string;
  descFr: string; descEn: string;
  status: string;
};

const field = "w-full rounded-xl border border-line bg-white px-4 py-3 text-base";
const lab = "mb-1 mt-4 block text-sm font-semibold";

export default function VideoForm({ initial, canDelete }: { initial: VideoValues; canDelete: boolean }) {
  const router = useRouter();
  const [v, setV] = useState<VideoValues>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const set = (k: keyof VideoValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/videos", { method: v.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
      if (res.ok) {
        router.push("/admin/ressources");
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(
        data.error === "invalid_url" ? "Adresse YouTube non reconnue. Collez l’adresse de la vidéo (youtube.com/watch?v=… ou youtu.be/…)."
        : data.error === "duplicate" ? "Cette vidéo est déjà enregistrée."
        : "Enregistrement impossible. Vérifiez les champs ou reconnectez-vous.",
      );
    } catch {
      setMessage("Erreur réseau. Réessayez.");
    }
    setBusy(false);
  }

  async function remove() {
    if (!v.id || !window.confirm("Supprimer définitivement cette vidéo ?")) return;
    setBusy(true);
    const res = await fetch("/api/admin/videos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: v.id }) });
    if (res.ok) {
      router.push("/admin/ressources");
      router.refresh();
    } else {
      setMessage("Suppression impossible.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-3xl rounded-2xl border border-line bg-white p-6">
      <label htmlFor="youtubeUrl" className={lab}>Adresse de la vidéo YouTube</label>
      <input id="youtubeUrl" required maxLength={300} placeholder="https://www.youtube.com/watch?v=…" className={field} value={v.youtubeUrl} onChange={set("youtubeUrl")} />
      <p className="mt-1 text-xs text-muted">Hébergez vos vidéos sur YouTube (en public ou « non répertoriée »), puis collez leur adresse ici.</p>

      <label htmlFor="titleFr" className={lab}>Titre (français)</label>
      <input id="titleFr" required minLength={3} maxLength={200} className={field} value={v.titleFr} onChange={set("titleFr")} />
      <label htmlFor="titleEn" className={lab}>Titre (anglais, facultatif)</label>
      <input id="titleEn" maxLength={200} className={field} value={v.titleEn} onChange={set("titleEn")} />
      <label htmlFor="descFr" className={lab}>Description (français)</label>
      <textarea id="descFr" rows={4} maxLength={3000} className={field} value={v.descFr} onChange={set("descFr")} />
      <label htmlFor="descEn" className={lab}>Description (anglais, facultatif)</label>
      <textarea id="descEn" rows={3} maxLength={3000} className={field} value={v.descEn} onChange={set("descEn")} />

      <label htmlFor="status" className={lab}>Statut</label>
      <select id="status" className={field} value={v.status} onChange={set("status")}>
        <option value="draft">Brouillon (non public)</option>
        <option value="published">Publié</option>
        <option value="archived">Archivé (non public)</option>
      </select>

      {message && <p role="alert" className="mt-4 text-sm">{message}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" className={btnPrimary} disabled={busy}>Enregistrer</button>
        <button type="button" className={btnGhost} onClick={() => router.push("/admin/ressources")}>Annuler</button>
        {v.id && canDelete && <button type="button" className={btnGhost} disabled={busy} onClick={remove}>Supprimer</button>}
      </div>
    </form>
  );
}
