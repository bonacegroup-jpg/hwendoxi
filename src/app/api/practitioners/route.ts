import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import type { PractitionerCard, SearchResponse } from "@/lib/types";

const PAGE_SIZE = 6;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  spiritual_name: string | null;
  title: string;
  specialties: string[] | null;
  years_declared: number | null;
  country: string;
  city: string;
  verification_level: number;
};
type ContactRow = { practitioner_id: string; kind: string; value: string };

// GET /api/practitioners?q=...&country=...&category=<uuid>&level=1..3&page=1
// Les entrées sont contrôlées ici ; la base de données applique ensuite ses propres règles
// (seuls les profils validés et les informations autorisées sont retournés).
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 80);
  const country = (sp.get("country") ?? "").trim().slice(0, 60) || null;
  const categoryRaw = sp.get("category");
  const category = categoryRaw && UUID.test(categoryRaw) ? categoryRaw : null;
  const levelRaw = Number(sp.get("level"));
  const level = [1, 2, 3].includes(levelRaw) ? levelRaw : null;
  const page = Math.max(1, Math.min(200, Number.parseInt(sp.get("page") ?? "1", 10) || 1));

  const supabase = createPublicClient();
  const args = { q: q || null, p_country: country, p_category: category, p_level: level };

  const [list, count] = await Promise.all([
    supabase.rpc("search_practitioners", { ...args, p_limit: PAGE_SIZE, p_offset: (page - 1) * PAGE_SIZE }),
    supabase.rpc("count_practitioners", args),
  ]);

  if (list.error || count.error) {
    console.error("Recherche :", list.error?.message ?? count.error?.message);
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }

  const rows = (list.data ?? []) as Row[];
  const ids = rows.map((r) => r.id);

  // Numéros autorisés à la publication uniquement (vue publique)
  let contacts: ContactRow[] = [];
  if (ids.length > 0) {
    const res = await supabase
      .from("practitioner_contacts_public")
      .select("practitioner_id, kind, value")
      .in("practitioner_id", ids);
    contacts = (res.data ?? []) as ContactRow[];
  }
  const phoneOf = (id: string) => {
    const mine = contacts.filter((c) => c.practitioner_id === id);
    return (mine.find((c) => c.kind === "phone") ?? mine.find((c) => c.kind === "whatsapp"))?.value ?? null;
  };

  const items: PractitionerCard[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: `${r.first_name} ${r.last_name}`,
    spiritualName: r.spiritual_name,
    title: r.title,
    country: r.country,
    city: r.city,
    specialty: (r.specialties ?? []).join(", "),
    level: (r.verification_level >= 1 && r.verification_level <= 3 ? r.verification_level : 1) as 1 | 2 | 3,
    years: r.years_declared,
    phone: phoneOf(r.id),
  }));

  const body: SearchResponse = { items, total: Number(count.data ?? 0), page, pageSize: PAGE_SIZE };
  return NextResponse.json(body);
}
