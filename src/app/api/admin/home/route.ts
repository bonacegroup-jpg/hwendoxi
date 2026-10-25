import { NextResponse, type NextRequest } from "next/server";
import { getStaff } from "@/lib/admin-auth";
import { SECTIONS, type Section } from "@/lib/featured";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const err = (error: string, status = 400) => NextResponse.json({ error }, { status });

// POST /api/admin/home {section, mode, max, items[]} : enregistre la sélection d'une section de la page d'accueil.
// Réservé au super-administrateur et aux éditeurs. Ne supprime jamais les contenus eux-mêmes : seules des références sont modifiées.
export async function POST(request: NextRequest) {
  const staff = await getStaff();
  if (!staff || (staff.role !== "super_admin" && staff.role !== "editor")) return err("forbidden", 403);

  const body = (await request.json().catch(() => null)) as { section?: unknown; mode?: unknown; max?: unknown; items?: unknown } | null;
  const section = body?.section as Section;
  const mode = body?.mode;
  const max = Number(body?.max);
  const items = Array.isArray(body?.items) ? (body.items as unknown[]) : null;

  if (!SECTIONS.includes(section) || (mode !== "auto" && mode !== "manual") || !Number.isInteger(max) || max < 1 || max > 12 || !items) {
    return err("invalid_request");
  }
  const clean = Array.from(new Set(items.filter((v): v is string => typeof v === "string" && UUID.test(v)))).slice(0, 24);

  const { error } = await staff.supabase.rpc("save_home_section", { p_section: section, p_mode: mode, p_max: max, p_items: clean });
  if (error) {
    console.error("Accueil (sélection) :", error.message);
    return err("save_failed", 500);
  }
  await createAdminClient().from("audit_logs").insert({
    actor_id: staff.user.id, actor_role: staff.role, action: "home.update", target_type: "home_section", target_id: section,
    details: { mode, max, count: clean.length },
  });
  return NextResponse.json({ ok: true });
}
