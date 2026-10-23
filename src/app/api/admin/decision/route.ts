import { NextResponse, type NextRequest } from "next/server";
import { getStaff } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Action = "approve" | "fix" | "reject" | "suspend";
type Admin = ReturnType<typeof createAdminClient>;
const err = (error: string, status = 400) => NextResponse.json({ error }, { status });

// Copie la photo validée vers l'espace public (seulement si le praticien a autorisé sa publication)
async function publishPhoto(admin: Admin, id: string, path: string): Promise<string | null> {
  const { data: blob, error } = await admin.storage.from("private-submissions").download(path);
  if (error || !blob) return null;
  const dest = `photos/${id}.${path.split(".").pop() ?? "jpg"}`;
  const { error: upErr } = await admin.storage.from("public-media").upload(dest, blob, { contentType: blob.type || "image/jpeg", upsert: true });
  return upErr ? null : dest;
}

// POST /api/admin/decision {id, action, level?, note?} : réservé aux vérificateurs et super-administrateurs connectés (2FA validée)
export async function POST(request: NextRequest) {
  const staff = await getStaff();
  if (!staff || (staff.role !== "super_admin" && staff.role !== "verifier")) return err("forbidden", 403);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return err("invalid_json");
  }
  const id = typeof body.id === "string" ? body.id : "";
  const action = body.action as Action;
  const level = Number(body.level);
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : "";
  if (!UUID.test(id) || !["approve", "fix", "reject", "suspend"].includes(action)) return err("invalid_request");
  if (action !== "approve" && note.length < 10) return err("note_required");
  if (action === "approve" && ![1, 2, 3].includes(level)) return err("invalid_level");

  const admin = createAdminClient();
  const { data: p } = await admin.from("practitioners").select("id, status, photo_path, photo_public").eq("id", id).maybeSingle();
  if (!p) return err("not_found", 404);
  const { data: priv } = await admin.from("practitioner_private").select("id_document_path, member_card_path, internal_notes").eq("practitioner_id", id).maybeSingle();

  const open = p.status === "pending" || p.status === "needs_changes";
  if ((action === "suspend" && p.status !== "approved") || (action !== "suspend" && !open)) return err("invalid_transition");
  if (action === "approve" && level === 2 && !priv?.member_card_path) return err("member_card_required");

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { reviewed_at: now, reviewed_by: staff.user.id };
  const privUpdate: Record<string, unknown> = {};
  const toRemove: string[] = [];
  const removeIdentity = action === "approve" || action === "reject";

  if (action === "approve") {
    Object.assign(update, { status: "approved", verification_level: level, published_at: now });
    if (p.photo_path) {
      const dest = p.photo_public ? await publishPhoto(admin, id, p.photo_path) : null;
      if (dest) update.photo_path = dest;
      else update.photo_public = false;
      if (dest || !p.photo_public) {
        toRemove.push(p.photo_path);
        if (!dest) update.photo_path = null;
      }
    }
  } else if (action === "reject") {
    update.status = "rejected";
    if (p.photo_path) {
      toRemove.push(p.photo_path);
      update.photo_path = null;
    }
  } else {
    update.status = action === "fix" ? "needs_changes" : "suspended";
  }

  if (removeIdentity) {
    if (priv?.id_document_path) toRemove.push(priv.id_document_path);
    if (priv?.member_card_path) toRemove.push(priv.member_card_path);
    Object.assign(privUpdate, { id_document_path: null, member_card_path: null, identity_deleted_at: now });
  }
  const line = `${new Date().toLocaleDateString("fr-FR")} — ${staff.name} — ${action}${action === "approve" ? ` niveau ${level}` : ""}${note ? ` : ${note}` : ""}`;
  privUpdate.internal_notes = [priv?.internal_notes, line].filter(Boolean).join("\n");

  const r1 = await admin.from("practitioners").update(update).eq("id", id);
  if (r1.error) {
    console.error("Décision (profil) :", r1.error.message);
    return err("save_failed", 500);
  }
  const r2 = await admin.from("practitioner_private").update(privUpdate).eq("practitioner_id", id);
  if (r2.error) console.error("Décision (notes) :", r2.error.message);

  await admin.from("audit_logs").insert({
    actor_id: staff.user.id, actor_role: staff.role, action: `practitioner.${action}`,
    target_type: "practitioner", target_id: id, details: { level: action === "approve" ? level : null, note: note || null },
  });

  if (toRemove.length > 0) {
    const { error } = await admin.storage.from("private-submissions").remove(toRemove);
    if (error) console.error("Décision (suppression des pièces) :", error.message);
  }
  return NextResponse.json({ ok: true });
}
