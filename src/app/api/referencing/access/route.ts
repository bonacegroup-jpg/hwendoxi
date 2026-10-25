import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { findApplicant } from "@/lib/applicant";
import type { AccessResponse } from "@/lib/edit-types";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type P = {
  first_name: string; last_name: string; spiritual_name: string | null; title: string; category_id: string | null;
  specialties: string[] | null; years_declared: number | null; bio: string | null; country: string; city: string;
  status: string; photo_public: boolean;
};

// POST /api/referencing/access {code, email} : renvoie les informations modifiables d'un dossier,
// uniquement si le code de suivi ET l'adresse e-mail déclarée correspondent.
export async function POST(request: NextRequest) {
  if (!(await rateLimit(request, "referencing-access", 10, 600))) return NextResponse.json({ error: "too_many" }, { status: 429 });
  const body = (await request.json().catch(() => null)) as { code?: unknown; email?: unknown; turnstile?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase().slice(0, 30) : "";
  const email = typeof body?.email === "string" ? body.email.trim().slice(0, 200) : "";
  if (!(await verifyTurnstile(typeof body?.turnstile === "string" ? body.turnstile : ""))) return NextResponse.json({ error: "bot_check" }, { status: 403 });
  if (!/^HWX-[A-Z0-9]{8}$/.test(code) || !email) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const admin = createAdminClient();
  const found = await findApplicant(admin, code, email);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [pr, contacts, pending] = await Promise.all([
    admin.from("practitioners").select("first_name, last_name, spiritual_name, title, category_id, specialties, years_declared, bio, country, city, status, photo_public").eq("id", found.id).maybeSingle(),
    admin.from("practitioner_contacts").select("kind, value, is_public").eq("practitioner_id", found.id),
    admin.from("profile_change_requests").select("id", { count: "exact", head: true }).eq("practitioner_id", found.id).eq("status", "pending"),
  ]);
  const p = pr.data as P | null;
  if (!p) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const rows = (contacts.data ?? []) as { kind: string; value: string; is_public: boolean }[];
  const value = (kind: string) => rows.find((c) => c.kind === kind)?.value ?? "";
  const pub = new Set<string>();
  if (p.photo_public) pub.add("photo");
  for (const c of rows) {
    if (!c.is_public) continue;
    pub.add(c.kind === "phone" || c.kind === "whatsapp" ? c.kind : "social");
  }

  const body2: AccessResponse = {
    status: p.status,
    message: found.message,
    canEdit: ["pending", "needs_changes", "approved"].includes(p.status),
    pendingChange: (pending.count ?? 0) > 0,
    hasIdDocument: !!found.idDocumentPath,
    profile: {
      firstName: p.first_name, lastName: p.last_name, spiritualName: p.spiritual_name ?? "", title: p.title,
      categoryId: p.category_id ?? "", specialty: (p.specialties ?? []).join(", "), years: p.years_declared, bio: p.bio ?? "",
      country: p.country, city: p.city, phone: value("phone"), whatsapp: value("whatsapp"),
      facebook: value("facebook"), instagram: value("instagram"), tiktok: value("tiktok"), x: value("x"), website: value("website"),
      pub: [...pub],
    },
  };
  return NextResponse.json(body2);
}
