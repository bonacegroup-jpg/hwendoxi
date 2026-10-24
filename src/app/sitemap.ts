import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { createPublicClient } from "@/lib/supabase/public";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

const staticPaths = ["", "/annuaire", "/annuaire/divinites", "/evenements", "/ressources", "/referencer-un-praticien", "/a-propos", "/mentions-legales", "/confidentialite"];

type Row = { slug: string; published_at?: string | null; starts_at?: string | null };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = routing.locales.flatMap((l) =>
    staticPaths.map((p) => ({
      url: `${siteUrl}/${l}${p}`,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : 0.5,
    })),
  );

  try {
    const supabase = createPublicClient();
    const [people, deities, events, articles] = await Promise.all([
      supabase.from("practitioners_public").select("slug, published_at"),
      supabase.from("deities").select("slug, published_at"),
      supabase.from("events").select("slug, starts_at"),
      supabase.from("articles").select("slug, published_at"),
    ]);
    const add = (rows: Row[], base: string, priority: number) => {
      for (const row of rows) {
        for (const l of routing.locales) {
          entries.push({
            url: `${siteUrl}/${l}${base}/${row.slug}`,
            lastModified: row.published_at ?? row.starts_at ?? undefined,
            changeFrequency: "weekly",
            priority,
          });
        }
      }
    };
    add((people.data ?? []) as Row[], "/annuaire/praticiens", 0.8);
    add((deities.data ?? []) as Row[], "/annuaire/divinites", 0.8);
    add((events.data ?? []) as Row[], "/evenements", 0.7);
    add((articles.data ?? []) as Row[], "/ressources", 0.7);
  } catch (error) {
    console.error("Sitemap : fiches non listées", error);
  }
  return entries;
}
