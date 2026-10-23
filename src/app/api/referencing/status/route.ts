import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// POST /api/referencing/status {code} : indique l'état d'un dossier à partir du code de suivi.
export async function POST(request: NextRequest) {
  let code = "";
  try {
    const body = (await request.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code.trim().toUpperCase().slice(0, 30) : "";
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!/^HWX-[A-Z0-9]{8}$/.test(code)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const admin = createAdminClient();
  const hash = createHash("sha256").update(code).digest("hex");

  const { data: priv } = await admin.from("practitioner_private").select("practitioner_id").eq("tracking_code_hash", hash).maybeSingle();
  if (!priv) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: p } = await admin.from("practitioners").select("status, submitted_at").eq("id", priv.practitioner_id).maybeSingle();
  if (!p) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ status: p.status, submittedAt: p.submitted_at });
}
