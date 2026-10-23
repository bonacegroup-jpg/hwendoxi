import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/reports : enregistre un signalement (jamais publié, examiné par l'équipe).
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Champ piège rempli = robot : on répond "ok" sans rien enregistrer.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const targetId = typeof body.targetId === "string" ? body.targetId : "";

  if (message.length < 10 || message.length > 2000) {
    return NextResponse.json({ error: "invalid_message" }, { status: 400 });
  }
  if (email && (email.length > 200 || !EMAIL.test(email))) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!UUID.test(targetId)) {
    return NextResponse.json({ error: "invalid_target" }, { status: 400 });
  }

  const supabase = createPublicClient();
  const { error } = await supabase.from("reports").insert({
    target_type: "practitioner",
    target_id: targetId,
    message,
    reporter_email: email || null,
  });

  if (error) {
    console.error("Signalement :", error.message);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
