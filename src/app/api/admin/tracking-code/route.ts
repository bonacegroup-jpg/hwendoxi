import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getStaff } from "@/lib/admin-auth";
import { hashCode } from "@/lib/applicant";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// POST /api/admin/tracking-code {id} : génère un NOUVEAU code de suivi (l'ancien cesse de fonctionner).
// À utiliser après avoir vérifié l'identité de la personne par un autre moyen. Le code n'est affiché qu'une fois.
export async function POST(request: NextRequest) {
  const staff = await getStaff();
  if (!staff || (staff.role !== "super_admin" && staff.role !== "verifier")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!UUID.test(id)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const code = "HWX-" + Array.from(randomBytes(8), (b) => ALPHABET[b % ALPHABET.length]).join("");
  const admin = createAdminClient();
  const { data, error } = await admin.from("practitioner_private").update({ tracking_code_hash: hashCode(code) }).eq("practitioner_id", id).select("practitioner_id");
  if (error || !data || data.length === 0) return NextResponse.json({ error: "save_failed" }, { status: 500 });

  await admin.from("audit_logs").insert({ actor_id: staff.user.id, actor_role: staff.role, action: "practitioner.new_tracking_code", target_type: "practitioner", target_id: id });
  return NextResponse.json({ code });
}
