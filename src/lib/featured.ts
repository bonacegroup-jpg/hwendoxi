import { createPublicClient } from "@/lib/supabase/public";

export const SECTIONS = ["practitioners", "events", "news", "videos", "documentation"] as const;
export type Section = (typeof SECTIONS)[number];
export type HomeConfig = { mode: "auto" | "manual"; max: number };

const DEFAULTS: Record<Section, HomeConfig> = {
  practitioners: { mode: "auto", max: 6 },
  events: { mode: "auto", max: 3 },
  news: { mode: "auto", max: 3 },
  videos: { mode: "auto", max: 3 },
  documentation: { mode: "auto", max: 3 },
};

// Réglages et sélection manuelle de chaque section de l'accueil.
// Si la migration n'est pas encore appliquée, tout reste en mode automatique (comportement d'origine).
export async function getHomeSelection() {
  const supabase = createPublicClient();
  const [cfg, feat] = await Promise.all([
    supabase.from("home_sections").select("section, mode, max_items"),
    supabase.from("home_featured").select("section, item_id, position").order("position", { ascending: true }),
  ]);

  const config: Record<Section, HomeConfig> = { ...DEFAULTS };
  for (const r of (cfg.data ?? []) as { section: Section; mode: string; max_items: number }[]) {
    if (r.section in config) {
      config[r.section] = { mode: r.mode === "manual" ? "manual" : "auto", max: Math.min(12, Math.max(1, r.max_items)) };
    }
  }
  const ids: Record<Section, string[]> = { practitioners: [], events: [], news: [], videos: [], documentation: [] };
  for (const r of (feat.data ?? []) as { section: Section; item_id: string }[]) {
    if (r.section in ids) ids[r.section].push(r.item_id);
  }
  return { config, ids };
}

// Remet des éléments dans l'ordre choisi par l'administrateur (les éléments introuvables ou non publiés sont ignorés).
export function inOrder<T extends { id: string }>(rows: T[], ids: string[]): T[] {
  return ids.map((id) => rows.find((r) => r.id === id)).filter((r): r is T => !!r);
}
