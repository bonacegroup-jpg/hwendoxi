import { NextResponse, type NextRequest } from "next/server";
import { getStaff } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/admin/report {id, status} : change l'état d'un signalement (vérificateurs et super-administrateurs)
export async function POST(request: NextRequest) {
  const staff = await getStaff();
  if (!staff || (staff.role !== "super_admin" && staff.role !== "verifier")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: { id?: unknown; status?: unknown };
  try {
    body = (await request.json()) as { id?: unknown; status?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";
  if (!UUID.test(id) || !["received", "in_review", "closed"].includes(status)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { error } = await staff.supabase.from("reports").update({ status, handled_by: staff.user.id }).eq("id", id);
  if (error) {
    console.error("Signalement :", error.message);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
  await createAdminClient().from("audit_logs").insert({
    actor_id: staff.user.id, actor_role: staff.role, action: `report.${status}`, target_type: "report", target_id: id,
  });
  return NextResponse.json({ ok: true });
}
