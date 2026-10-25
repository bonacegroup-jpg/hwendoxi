"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnGhost, btnPrimary } from "@/lib/ui";

export type Item = { id: string; label: string };
export type SectionData = {
  section: string;
  title: string;
  help: string;
  mode: "auto" | "manual";
  max: number;
  selected: string[];
  candidates: Item[];
};

const field = "rounded-xl border border-line bg-white px-3 py-2 text-base";

function SectionEditor({ data }: { data: SectionData }) {
  const router = useRouter();
  const [mode, setMode] = useState(data.mode);
  const [max, setMax] = useState(data.max);
  const [selected, setSelected] = useState<string[]>(data.selected);
  const [toAdd, setToAdd] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const label = (id: string) => data.candidates.find((c) => c.id === id)?.label ?? "(contenu non publié ou introuvable)";
  const available = data.candidates.filter((c) => !selected.includes(c.id));

  const move = (i: number, d: -1 | 1) =>
    setSelected((s) => {
      const j = i + d;
      if (j < 0 || j >= s.length) return s;
      const next = [...s];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: data.section, mode, max, items: selected }),
      });
      if (res.ok) {
        setMessage("Enregistré. La page d’accueil se met à jour en moins d’une minute.");
        router.refresh();
      } else {
        setMessage("Enregistrement impossible. Reconnectez-vous ou réessayez.");
      }
    } catch {
      setMessage("Erreur réseau. Réessayez.");
    }
    setBusy(false);
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-6">
      <h2 className="font-serif text-xl font-bold">{data.title}</h2>
      <p className="mb-4 text-sm text-muted">{data.help}</p>

      <fieldset className="mb-4">
        <legend className="mb-1 text-sm font-semibold">Mode d’affichage</legend>
        <label className="mr-6 inline-flex items-center gap-2 text-sm">
          <input type="radio" name={`mode-${data.section}`} checked={mode === "auto"} onChange={() => setMode("auto")} />
          Automatique (les plus récents)
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="radio" name={`mode-${data.section}`} checked={mode === "manual"} onChange={() => setMode("manual")} />
          Sélection manuelle
        </label>
      </fieldset>

      <label htmlFor={`max-${data.section}`} className="mb-4 block text-sm font-semibold">
        Nombre d’éléments affichés{" "}
        <select id={`max-${data.section}`} className={field} value={max} onChange={(e) => setMax(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>

      {mode === "manual" && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold">Éléments mis en avant, dans l’ordre d’affichage</p>
          {selected.length === 0 ? (
            <p className="text-sm text-muted">Aucun élément sélectionné : cette section sera vide sur la page d’accueil.</p>
          ) : (
            <ol className="space-y-2">
              {selected.map((id, i) => (
                <li key={id} className={`flex flex-wrap items-center gap-2 rounded-xl border border-line p-2 text-sm ${i >= max ? "opacity-50" : ""}`}>
                  <span className="w-6 text-center font-bold text-gold-dark">{i + 1}</span>
                  <span className="min-w-0 flex-1">{label(id)}{i >= max ? " (au-delà du nombre affiché)" : ""}</span>
                  <button type="button" className={`${btnGhost} !px-3 !py-1 text-sm`} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter">↑</button>
                  <button type="button" className={`${btnGhost} !px-3 !py-1 text-sm`} onClick={() => move(i, 1)} disabled={i === selected.length - 1} aria-label="Descendre">↓</button>
                  <button type="button" className={`${btnGhost} !px-3 !py-1 text-sm`} onClick={() => setSelected((s) => s.filter((x) => x !== id))}>Retirer</button>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label htmlFor={`add-${data.section}`} className="sr-only">Ajouter un élément</label>
            <select id={`add-${data.section}`} className={`${field} min-w-0 flex-1`} value={toAdd} onChange={(e) => setToAdd(e.target.value)}>
              <option value="">Ajouter un élément…</option>
              {available.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button type="button" className={btnGhost} disabled={!toAdd} onClick={() => { setSelected((s) => [...s, toAdd]); setToAdd(""); }}>Ajouter</button>
          </div>
        </div>
      )}

      <button type="button" className={btnPrimary} disabled={busy} onClick={save}>Enregistrer cette section</button>
      {message && <p role="status" className="mt-3 text-sm">{message}</p>}
    </section>
  );
}

export default function HomeManager({ sections }: { sections: SectionData[] }) {
  return <div className="space-y-6">{sections.map((s) => <SectionEditor key={s.section} data={s} />)}</div>;
}
