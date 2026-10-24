"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnGhost, btnPrimary } from "@/lib/ui";

export type EventValues = {
  id?: string;
  titleFr: string;
  titleEn: string;
  descFr: string;
  descEn: string;
  startsAt: string; // « 2026-11-05T18:00 » (heure locale du lieu)
  endsAt: string;
  location: string;
  organizer: string;
  contact: string;
  registrationUrl: string;
  status: string;
};

const field = "w-full rounded-xl border border-line bg-white px-4 py-3 text-base";
const lab = "mb-1 mt-4 block text-sm font-semibold";
const EMPTY: EventValues = { titleFr: "", titleEn: "", descFr: "", descEn: "", startsAt: "", endsAt: "", location: "", organizer: "", contact: "", registrationUrl: "", status: "draft" };

// Réduit l'affiche avant l'envoi (2 Mo maximum)
async function prepareImage(file: File): Promise<File | null> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return null;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file.size <= 2_000_000 ? file : null;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    return blob && blob.size <= 2_000_000 ? new File([blob], "affiche.jpg", { type: "image/jpeg" }) : null;
  } catch {
    return file.size <= 2_000_000 ? file : null;
  }
}

export default function EventForm({ initial, currentImageUrl, canDelete }: { initial?: EventValues; currentImageUrl?: string | null; canDelete: boolean }) {
  const router = useRouter();
  const [v, setV] = useState<EventValues>(initial ?? EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const set = (k: keyof EventValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const fd = new FormData();
    fd.set("data", JSON.stringify({ ...v, removeImage }));
    if (file) {
      const prepared = await prepareImage(file);
      if (!prepared) {
        setMessage("L’affiche doit être une image JPG, PNG ou WebP de 2 Mo maximum.");
        setBusy(false);
        return;
      }
      fd.set("image", prepared, prepared.name);
    }
    try {
      const res = await fetch("/api/admin/events", { method: v.id ? "PUT" : "POST", body: fd });
      if (res.ok) {
        router.push("/admin/evenements");
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(
        data.error === "invalid_dates" ? "La date de fin doit être postérieure à la date de début."
        : data.error === "invalid_url" ? "Le lien d’inscription doit commencer par https://"
        : data.error === "invalid_image" ? "Affiche refusée : format ou taille non pris en charge."
        : "Enregistrement impossible. Vérifiez les champs ou reconnectez-vous.",
      );
    } catch {
      setMessage("Erreur réseau. Réessayez.");
    }
    setBusy(false);
  }

  async function remove() {
    if (!v.id || !window.confirm("Supprimer définitivement cet événement ?")) return;
    setBusy(true);
    const res = await fetch("/api/admin/events", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: v.id }) });
    if (res.ok) {
      router.push("/admin/evenements");
      router.refresh();
    } else {
      setMessage("Suppression impossible.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-3xl rounded-2xl border border-line bg-white p-6">
      <label htmlFor="titleFr" className={lab}>Titre (français)</label>
      <input id="titleFr" required minLength={3} maxLength={200} className={field} value={v.titleFr} onChange={set("titleFr")} />
      <label htmlFor="titleEn" className={lab}>Titre (anglais, facultatif)</label>
      <input id="titleEn" maxLength={200} className={field} value={v.titleEn} onChange={set("titleEn")} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="startsAt" className={lab}>Début (heure locale du lieu)</label>
          <input id="startsAt" type="datetime-local" required className={field} value={v.startsAt} onChange={set("startsAt")} />
        </div>
        <div>
          <label htmlFor="endsAt" className={lab}>Fin (facultatif)</label>
          <input id="endsAt" type="datetime-local" className={field} value={v.endsAt} onChange={set("endsAt")} />
        </div>
      </div>

      <label htmlFor="location" className={lab}>Lieu</label>
      <input id="location" maxLength={200} className={field} value={v.location} onChange={set("location")} />
      <label htmlFor="organizer" className={lab}>Organisateur</label>
      <input id="organizer" maxLength={200} className={field} value={v.organizer} onChange={set("organizer")} />
      <label htmlFor="contact" className={lab}>Contact (e-mail ou téléphone)</label>
      <input id="contact" maxLength={200} className={field} value={v.contact} onChange={set("contact")} />
      <label htmlFor="registrationUrl" className={lab}>Lien d’inscription (facultatif, https://…)</label>
      <input id="registrationUrl" type="url" maxLength={300} className={field} value={v.registrationUrl} onChange={set("registrationUrl")} />

      <label htmlFor="descFr" className={lab}>Description (français)</label>
      <textarea id="descFr" rows={6} maxLength={5000} className={field} value={v.descFr} onChange={set("descFr")} />
      <label htmlFor="descEn" className={lab}>Description (anglais, facultatif)</label>
      <textarea id="descEn" rows={4} maxLength={5000} className={field} value={v.descEn} onChange={set("descEn")} />

      <label htmlFor="image" className={lab}>Affiche (JPG, PNG ou WebP)</label>
      {currentImageUrl && !removeImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentImageUrl} alt="Affiche actuelle" className="mb-2 max-h-48 rounded-xl border border-line" />
        </>
      )}
      <input id="image" type="file" accept="image/jpeg,image/png,image/webp" className={field} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      {currentImageUrl && (
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} />
          Retirer l’affiche actuelle
        </label>
      )}

      <label htmlFor="status" className={lab}>Statut</label>
      <select id="status" className={field} value={v.status} onChange={set("status")}>
        <option value="draft">Brouillon (non public)</option>
        <option value="published">Publié</option>
        <option value="archived">Archivé (non public)</option>
      </select>
      <p className="mt-2 text-xs text-muted">« À venir », « En cours » et « Terminé » se calculent automatiquement d’après les dates.</p>

      {message && <p role="alert" className="mt-4 text-sm">{message}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" className={btnPrimary} disabled={busy}>Enregistrer</button>
        <button type="button" className={btnGhost} onClick={() => router.push("/admin/evenements")}>Annuler</button>
        {v.id && canDelete && <button type="button" className={btnGhost} disabled={busy} onClick={remove}>Supprimer</button>}
      </div>
    </form>
  );
}
