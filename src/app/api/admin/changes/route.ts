import { NextResponse, type NextRequest } from "next/server";
import { getStaff } from "@/lib/admin-auth";
import { publishPhoto } from "@/lib/photos";
import { buildContacts, profileColumns, type ProfilePayload } from "@/lib/profile-input";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VERSION = "2026-10-provisoire";
const err = (error: string, status = 400) => NextResponse.json({ error }, { status });
type Payload = ProfilePayload & { photoPath: string | null; photoPublic: boolean };

// POST /api/admin/changes {id, action: "approve" | "reject", note?} : décision sur une demande de modification de profil
export async function POST(request: NextRequest) {
  const staff = await getStaff();
  if (!staff || (staff.role !== "super_admin" && staff.role !== "verifier")) return err("forbidden", 403);

  const body = (await request.json().catch(() => null)) as { id?: unknown; action?: unknown; note?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const action = body?.action;
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 1000) : "";
  if (!UUID.test(id) || (action !== "approve" && action !== "reject")) return err("invalid_request");
  if (action === "reject" && note.length < 10) return err("note_required");

  const admin = createAdminClient();
  const { data: req } = await admin.from("profile_change_requests").select("id, practitioner_id, payload, status").eq("id", id).maybeSingle();
  if (!req || req.status !== "pending") return err("not_found", 404);
  const payload = req.payload as Payload;
  const pid = req.practitioner_id as string;
  const now = new Date().toISOString();

  const { data: p } = await admin.from("practitioners").select("photo_path, photo_public").eq("id", pid).maybeSingle();
  if (!p) return err("not_found", 404);

  const removePrivate: string[] = [];
  const removePublic: string[] = [];

  if (action === "reject") {
    if (payload.photoPath) removePrivate.push(payload.photoPath);
    await admin.from("profile_change_requests").update({ status: "rejected", review_note: note, reviewed_by: staff.user.id, reviewed_at: now }).eq("id", id);
    await admin.from("practitioner_private").update({ applicant_message: note }).eq("practitioner_id", pid);
  } else {
    // Photo : nouvelle photo éventuelle, publication ou retrait selon le choix de la personne
    let path = p.photo_path as string | null;
    if (payload.photoPath) {
      if (path) (path.startsWith("photos/") ? removePublic : removePrivate).push(path);
      path = payload.photoPath;
    }
    let isPublic = payload.photoPublic && !!path;
    if (isPublic && path && path.startsWith("submissions/")) {
      const dest = await publishPhoto(admin, pid, path);
      if (dest) {
        removePrivate.push(path);
        path = dest;
      } else {
        isPublic = false;
      }
    }
    if (!isPublic && path && path.startsWith("photos/")) {
      removePublic.push(path);
      path = null;
    }

    const r1 = await admin.from("practitioners").update({
      ...profileColumns(payload), photo_path: path, photo_public: isPublic, reviewed_at: now, reviewed_by: staff.user.id,
    }).eq("id", pid);
    if (r1.error) {
      console.error("Modification (application) :", r1.error.message);
      return err("save_failed", 500);
    }
    await admin.from("practitioner_contacts").delete().eq("practitioner_id", pid);
    await admin.from("practitioner_contacts").insert(buildContacts(payload).map((c) => ({ practitioner_id: pid, ...c })));
    await admin.from("consents").insert({
      practitioner_id: pid, terms_version: VERSION, privacy_version: VERSION, published_fields: payload.pub,
      accuracy_confirmed: true, photo_rights_confirmed: !!payload.photoPath || !!p.photo_path,
    });
    await admin.from("profile_change_requests").update({ status: "approved", review_note: note || null, reviewed_by: staff.user.id, reviewed_at: now }).eq("id", id);
    await admin.from("practitioner_private").update({ applicant_message: null }).eq("practitioner_id", pid);
  }

  await admin.from("audit_logs").insert({
    actor_id: staff.user.id, actor_role: staff.role, action: `change.${action}`, target_type: "practitioner", target_id: pid, details: { note: note || null },
  });
  if (removePrivate.length) await admin.storage.from("private-submissions").remove(removePrivate);
  if (removePublic.length) await admin.storage.from("public-media").remove(removePublic);
  return NextResponse.json({ ok: true });
}
