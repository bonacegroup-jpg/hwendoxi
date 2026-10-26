"use client";

import { useRef, useState } from "react";
import Markdown from "@/components/Markdown";
import { uploadContentImage } from "@/lib/upload-client";

const tool = "rounded-lg border border-line bg-white px-3 py-1.5 text-sm hover:border-gold disabled:opacity-50";

// Éditeur de textes : barre d'outils (titres, gras, italique, lien, listes, citation, images) + aperçu fidèle.
export default function RichEditor({ label, value, onChange, rows = 14 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Remplace la sélection (ou insère un texte d'exemple) à l'endroit du curseur
  function edit(transform: (selected: string) => string, fallback: string) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const insertion = transform(value.slice(start, end) || fallback);
    onChange(value.slice(0, start) + insertion + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, start + insertion.length);
    });
  }

  const block = (prefix: string, fallback: string) => edit((s) => `\n\n${s.split("\n").map((l) => `${prefix}${l}`).join("\n")}\n\n`, fallback);

  function link() {
    const url = window.prompt("Adresse du lien (commence par https://)", "https://");
    if (!url || !/^https?:\/\//i.test(url)) return;
    edit((s) => `[${s}](${url})`, "texte du lien");
  }

  async function addImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const path = await uploadContentImage(file);
      edit(() => `\n\n![Légende de l’image](${path})\n\n`, "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    }
    setBusy(false);
  }

  return (
    <div className="mt-4">
      <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        <div role="tablist" className="flex gap-1 text-sm">
          <button type="button" role="tab" aria-selected={tab === "write"} className={`rounded-full px-3 py-1 ${tab === "write" ? "bg-gold font-semibold" : "border border-line"}`} onClick={() => setTab("write")}>Rédiger</button>
          <button type="button" role="tab" aria-selected={tab === "preview"} className={`rounded-full px-3 py-1 ${tab === "preview" ? "bg-gold font-semibold" : "border border-line"}`} onClick={() => setTab("preview")}>Aperçu</button>
        </div>
      </div>

      {tab === "write" ? (
        <>
          <div className="mb-2 flex flex-wrap gap-2" role="toolbar" aria-label="Mise en forme">
            <button type="button" className={tool} onClick={() => block("## ", "Titre")}>Titre</button>
            <button type="button" className={tool} onClick={() => block("### ", "Sous-titre")}>Sous-titre</button>
            <button type="button" className={`${tool} font-bold`} onClick={() => edit((s) => `**${s}**`, "texte en gras")}>G</button>
            <button type="button" className={`${tool} italic`} onClick={() => edit((s) => `*${s}*`, "texte en italique")}>I</button>
            <button type="button" className={tool} onClick={link}>Lien</button>
            <button type="button" className={tool} onClick={() => block("- ", "élément de liste")}>Liste</button>
            <button type="button" className={tool} onClick={() => block("> ", "citation")}>Citation</button>
            <label className={`${tool} cursor-pointer`}>
              {busy ? "Envoi…" : "Image"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={addImage} />
            </label>
          </div>
          <textarea
            ref={ref}
            aria-label={label}
            rows={rows}
            maxLength={30000}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-line bg-white px-4 py-3 font-mono text-sm leading-relaxed"
          />
          <p className="mt-1 text-xs text-muted">
            Sélectionnez un texte puis cliquez sur un outil. L’image est insérée à l’endroit du curseur : modifiez sa légende entre les crochets, ou déplacez la ligne
            <code className="mx-1 rounded bg-sand px-1">![…](content/…)</code>pour la placer ailleurs.
          </p>
        </>
      ) : (
        <div className="min-h-40 rounded-xl border border-line bg-white p-4">
          {value.trim() ? <Markdown text={value} /> : <p className="text-muted">Rien à afficher pour le moment.</p>}
        </div>
      )}
      {error && <p role="alert" className="mt-1 text-sm">{error}</p>}
    </div>
  );
}
