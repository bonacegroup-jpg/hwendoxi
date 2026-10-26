"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnGhost, btnPrimary } from "@/lib/ui";
import CoverImageField from "./CoverImageField";
import RichEditor from "./RichEditor";

export type DeityValues = {
  id?: string;
  name: string;
  otherNames: string;
  region: string;
  traditionId: string;
  descFr: string;
  descEn: string;
  sources: string;
  imagePath: string | null;
  status: string;
};

const field = "w-full rounded-xl border border-line bg-white px-4 py-3 text-base";
const lab = "mb-1 mt-4 block text-sm font-semibold";
const EMPTY: DeityValues = { name: "", otherNames: "", region: "", traditionId: "", descFr: "", descEn: "", sources: "", imagePath: null, status: "draft" };

export default function DeityForm({
  initial,
  traditions,
  canDelete,
}: {
  initial?: DeityValues;
  traditions: { id: string; name: string }[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [v, setV] = useState<DeityValues>(initial ?? EMPTY);
  const [newTradition, setNewTradition] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const set = (k: keyof DeityValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/deities", {
        method: v.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, newTradition }),
      });
      if (res.ok) {
        router.push("/admin/divinites");
        router.refresh();
        return;
      }
      setMessage("Enregistrement impossible. Vérifiez les champs ou reconnectez-vous.");
    } catch {
      setMessage("Erreur réseau. Réessayez.");
    }
    setBusy(false);
  }

  async function remove() {
    if (!v.id || !window.confirm("Supprimer définitivement cette fiche ?")) return;
    setBusy(true);
    const res = await fetch("/api/admin/deities", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: v.id }),
    });
    if (res.ok) {
      router.push("/admin/divinites");
      router.refresh();
    } else {
      setMessage("Suppression impossible.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-3xl rounded-2xl border border-line bg-white p-6">
      <label htmlFor="name" className={lab}>Nom de la divinité</label>
      <input id="name" required minLength={2} maxLength={120} className={field} value={v.name} onChange={set("name")} />

      <label htmlFor="otherNames" className={lab}>Autres appellations (séparées par des virgules)</label>
      <input id="otherNames" maxLength={800} className={field} value={v.otherNames} onChange={set("otherNames")} />

      <CoverImageField label="Image principale" value={v.imagePath} onChange={(imagePath) => setV((s) => ({ ...s, imagePath }))} />

      <label htmlFor="traditionId" className={lab}>Tradition ou aire culturelle</label>
      <select id="traditionId" className={field} value={v.traditionId} onChange={set("traditionId")}>
        <option value="">— Aucune —</option>
        {traditions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <label htmlFor="newTradition" className={lab}>… ou créer une nouvelle tradition (nom en français)</label>
      <input id="newTradition" maxLength={120} className={field} value={newTradition} onChange={(e) => setNewTradition(e.target.value)} />

      <label htmlFor="region" className={lab}>Région ou pays d’origine (si documenté)</label>
      <input id="region" maxLength={120} className={field} value={v.region} onChange={set("region")} />

      <RichEditor label="Description documentée (français)" value={v.descFr} onChange={(descFr) => setV((s) => ({ ...s, descFr }))} rows={14} />
      <RichEditor label="Description (anglais, facultatif)" value={v.descEn} onChange={(descEn) => setV((s) => ({ ...s, descEn }))} rows={9} />

      <label htmlFor="sources" className={lab}>Sources documentaires (une par ligne : « Titre | https://adresse », l’adresse est facultative)</label>
      <textarea id="sources" rows={4} maxLength={6000} className={field} value={v.sources} onChange={set("sources")} />

      <label htmlFor="status" className={lab}>Statut</label>
      <select id="status" className={field} value={v.status} onChange={set("status")}>
        <option value="draft">Brouillon (non public)</option>
        <option value="published">Publié</option>
        <option value="archived">Archivé (non public)</option>
      </select>

      {message && <p role="alert" className="mt-4 text-sm">{message}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" className={btnPrimary} disabled={busy}>Enregistrer</button>
        <button type="button" className={btnGhost} onClick={() => router.push("/admin/divinites")}>Annuler</button>
        {v.id && canDelete && <button type="button" className={btnGhost} disabled={busy} onClick={remove}>Supprimer</button>}
      </div>
      <p className="mt-3 text-xs text-muted">Ne publiez que des informations et des images dont la diffusion est autorisée. Les savoirs confidentiels ne doivent pas être exposés.</p>
    </form>
  );
}
