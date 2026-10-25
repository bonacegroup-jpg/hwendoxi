import type { createPublicClient } from "@/lib/supabase/public";
import { publicMediaUrl } from "@/lib/media";
import type { PractitionerCard } from "@/lib/types";

type Client = ReturnType<typeof createPublicClient>;

export const PRACTITIONER_COLUMNS = "id, slug, display_name, title, specialties, years_declared, country, city, verification_level, photo_path";

export type PractitionerRow = {
  id: string; slug: string; display_name: string; title: string; specialties: string[] | null; years_declared: number | null;
  country: string; city: string; verification_level: number; photo_path: string | null;
};

// Transforme des lignes de la vue publique en cartes (avec les seuls numéros autorisés à la publication).
export async function toCards(supabase: Client, rows: PractitionerRow[]): Promise<PractitionerCard[]> {
  const ids = rows.map((r) => r.id);
  let contacts: { practitioner_id: string; kind: string; value: string }[] = [];
  if (ids.length > 0) {
    const res = await supabase.from("practitioner_contacts_public").select("practitioner_id, kind, value").in("practitioner_id", ids);
    contacts = (res.data ?? []) as typeof contacts;
  }
  const phoneOf = (id: string) => {
    const mine = contacts.filter((c) => c.practitioner_id === id);
    return (mine.find((c) => c.kind === "phone") ?? mine.find((c) => c.kind === "whatsapp"))?.value ?? null;
  };
  return rows.map((r) => ({
    id: r.id, slug: r.slug, name: r.display_name, title: r.title, country: r.country, city: r.city,
    specialty: (r.specialties ?? []).join(", "),
    level: (r.verification_level >= 1 && r.verification_level <= 3 ? r.verification_level : 1) as 1 | 2 | 3,
    years: r.years_declared, phone: phoneOf(r.id), photoUrl: publicMediaUrl(r.photo_path),
  }));
}
