"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnGhost, btnPrimary } from "@/lib/ui";

export type ArticleValues = {
  id?: string;
  kind: "documentation" | "news";
  titleFr: string; titleEn: string;
  summaryFr: string; summaryEn: string;
  bodyFr: string; bodyEn: string;
  status: string;
};

const field = "w-full rounded-xl border border-line bg-white px-4 py-3 text-base";
const lab = "mb-1 mt-4 block text-sm font-semibold";

export default function ArticleForm({ initial, canDelete }: { initial: ArticleValues; canDelete: boolean }) {
  const router = useRouter();
  const [v, setV] = useState<ArticleValues>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const set = (k: keyof ArticleValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/articles", { method: v.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
      if (res.ok) {
        router.push("/admin/ressources");
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
    if (!v.id || !window.confirm("Supprimer définitivement ce contenu ?")) return;
    setBusy(true);
    const res = await fetch("/api/admin/articles", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: v.id }) });
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
      <label htmlFor="kind" className={lab}>Type de contenu</label>
      <select id="kind" className={field} value={v.kind} onChange={set("kind")}>
        <option value="documentation">Documentation</option>
        <option value="news">Actualité</option>
      </select>

      <label htmlFor="titleFr" className={lab}>Titre (français)</label>
      <input id="titleFr" required minLength={3} maxLength={200} className={field} value={v.titleFr} onChange={set("titleFr")} />
      <label htmlFor="titleEn" className={lab}>Titre (anglais, facultatif)</label>
      <input id="titleEn" maxLength={200} className={field} value={v.titleEn} onChange={set("titleEn")} />

      <label htmlFor="summaryFr" className={lab}>Résumé (français, 400 caractères maximum)</label>
      <textarea id="summaryFr" rows={2} maxLength={400} className={field} value={v.summaryFr} onChange={set("summaryFr")} />
      <label htmlFor="summaryEn" className={lab}>Résumé (anglais, facultatif)</label>
      <textarea id="summaryEn" rows={2} maxLength={400} className={field} value={v.summaryEn} onChange={set("summaryEn")} />

      <label htmlFor="bodyFr" className={lab}>Texte (français)</label>
      <textarea id="bodyFr" rows={14} maxLength={30000} className={field} value={v.bodyFr} onChange={set("bodyFr")} />
      <label htmlFor="bodyEn" className={lab}>Texte (anglais, facultatif)</label>
      <textarea id="bodyEn" rows={8} maxLength={30000} className={field} value={v.bodyEn} onChange={set("bodyEn")} />
      <p className="mt-1 text-xs text-muted">Les sauts de ligne sont conservés. Ne publiez que des contenus dont la diffusion est autorisée.</p>

      <p className="mt-4 rounded-xl bg-sand p-3 text-sm">
        Contenus de pharmacopée : présentez-les à titre documentaire, sans allégation médicale non vérifiée ni recommandation dangereuse. Les savoirs confidentiels ne doivent pas être exposés.
      </p>

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
