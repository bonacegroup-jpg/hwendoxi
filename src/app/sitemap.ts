import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { createPublicClient } from "@/lib/supabase/public";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

const staticPaths = ["", "/a-propos", "/mentions-legales", "/confidentialite"];

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
    const { data } = await supabase.from("practitioners_public").select("slug, published_at");
    for (const row of (data ?? []) as { slug: string; published_at: string | null }[]) {
      for (const l of routing.locales) {
        entries.push({
          url: `${siteUrl}/${l}/annuaire/praticiens/${row.slug}`,
          lastModified: row.published_at ?? undefined,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
  } catch (error) {
    console.error("Sitemap : profils non listés", error);
  }
  return entries;
}
