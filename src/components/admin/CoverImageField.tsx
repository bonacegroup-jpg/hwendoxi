"use client";

import { useState } from "react";
import { publicMediaUrl } from "@/lib/media";
import { uploadContentImage } from "@/lib/upload-client";
import { btnGhost } from "@/lib/ui";

// Image principale d'un contenu : envoi, aperçu, remplacement et retrait.
export default function CoverImageField({ label, value, onChange }: { label: string; value: string | null; onChange: (path: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const url = publicMediaUrl(value);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await uploadContentImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    }
    setBusy(false);
  }

  return (
    <div>
      <p className="mb-1 mt-4 text-sm font-semibold">{label}</p>
      {url && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Image principale actuelle" className="mb-2 max-h-56 rounded-xl border border-line" />
        </>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <label className={`${btnGhost} cursor-pointer !px-4 !py-2 text-sm`}>
          {busy ? "Envoi en cours…" : url ? "Remplacer l’image" : "Ajouter une image"}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={pick} />
        </label>
        {url && <button type="button" className="text-sm underline" onClick={() => onChange(null)}>Retirer l’image</button>}
      </div>
      <p className="mt-1 text-xs text-muted">JPG, PNG ou WebP. L’image est réduite automatiquement. Elle sera enregistrée quand vous cliquerez sur « Enregistrer ».</p>
      {error && <p role="alert" className="mt-1 text-sm">{error}</p>}
    </div>
  );
}
