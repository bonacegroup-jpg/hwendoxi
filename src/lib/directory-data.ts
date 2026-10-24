import { createPublicClient } from "@/lib/supabase/public";
import type { CategoryOption } from "@/lib/types";

// Filtres de l'annuaire : catégories (dans la langue du visiteur) et pays présents parmi les profils validés.
export async function getDirectoryFilters(locale: string): Promise<{ categories: CategoryOption[]; countries: string[] }> {
  const supabase = createPublicClient();
  const [cats, people] = await Promise.all([
    supabase.from("categories").select("id, name, position").order("position"),
    supabase.from("practitioners_public").select("country"),
  ]);
  const categories = ((cats.data ?? []) as { id: string; name: Record<string, string> }[]).map((c) => ({
    id: c.id,
    name: c.name[locale] ?? c.name.fr ?? "",
  }));
  const countries = Array.from(new Set(((people.data ?? []) as { country: string }[]).map((r) => r.country))).sort();
  return { categories, countries };
}
