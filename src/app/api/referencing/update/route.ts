import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { findApplicant } from "@/lib/applicant";
import { buildContacts, parseProfile, profileColumns, text } from "@/lib/profile-input";
import { createAdminClient } from "@/lib/supabase/admin";
import { readUpload } from "@/lib/uploads";

export const runtime = "nodejs";
export const maxDuration = 30;

const VERSION = "2026-10-provisoire";
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

// POST /api/referencing/update : corrections d'un dossier en cours, ou demande de modification d'un profil publié.
// Identification : code de suivi + e-mail déclaré. Rien n'est publié sans examen du comité.
export async function POST(request: NextRequest) {
  const fd = await request.formData().catch(() => null);
  if (!fd) return fail("invalid_form");
  if (text(fd, "company", 100) !== "") return fail("rejected");

  const code = text(fd, "code", 30).toUpperCase();
  const email = text(fd, "email", 200);
  if (!/^HWX-[A-Z0-9]{8}$/.test(code) || !email) return fail("not_found", 404);

  const admin = createAdminClient();
  const found = await findApplicant(admin, code, email);
  if (!found) return fail("not_found", 404);
  const id = found.id;

  const { data: p } = await admin.from("practitioners").select("id, status, first_name, last_name, photo_path, photo_public").eq("id", id).maybeSingle();
  if (!p || !["pending", "needs_changes", "approved"].includes(p.status as string)) return fail("not_editable", 403);
  const approved = p.status === "approved";

  const profile = parseProfile(fd);
  if (!profile) return fail("invalid_field");
  if (fd.get("accuracy") !== "on") return fail("consent_required");

  const stamp = randomBytes(3).toString("hex");
  const photo = await readUpload(fd, "photo", `submissions/${id}/photo-${stamp}`, false, 1_500_000);
  const idDoc = approved ? ({ ok: true, file: null } as const) : await readUpload(fd, "idDoc", `submissions/${id}/identity-${stamp}`, true, 2_500_000);
  if (!photo.ok || !idDoc.ok) return fail("invalid_file");
  if (photo.file && fd.get("photoRights") !== "on") return fail("photo_rights");

  if (approved) {
    const { count } = await admin.from("profile_change_requests").select("id", { count: "exact", head: true }).eq("practitioner_id", id).eq("status", "pending");
    if ((count ?? 0) > 0) return fail("request_pending", 409);
  }

  const uploaded: string[] = [];
  const cleanup = async () => {
    if (uploaded.length) await admin.storage.from("private-submissions").remove(uploaded);
  };
  for (const f of [photo.file, idDoc.file]) {
    if (!f) continue;
    const { error } = await admin.storage.from("private-submissions").upload(f.path, f.buffer, { contentType: f.mime, upsert: false });
    if (error) {
      console.error("Modification (envoi fichier) :", error.message);
      await cleanup();
      return fail("storage_failed", 500);
    }
    uploaded.push(f.path);
  }

  const wantsPhoto = profile.pub.includes("photo");

  // Profil déjà publié : on enregistre une DEMANDE, le profil affiché ne change pas avant l'accord du comité.
  if (approved) {
    const { error } = await admin.from("profile_change_requests").insert({
      practitioner_id: id,
      payload: { ...profile, photoPath: photo.file?.path ?? null, photoPublic: wantsPhoto },
    });
    if (error) {
      console.error("Modification (demande) :", error.message);
      await cleanup();
      return fail(error.code === "23505" ? "request_pending" : "save_failed", error.code === "23505" ? 409 : 500);
    }
    await admin.from("audit_logs").insert({ actor_role: "applicant", action: "applicant.change_request", target_type: "practitioner", target_id: id });
    return NextResponse.json({ ok: true, mode: "change_requested" });
  }

  // Dossier en cours (en attente ou corrections demandées) : mise à jour directe, il repasse « en attente ».
  const firstName = text(fd, "firstName", 80);
  const lastName = text(fd, "lastName", 80);
  const newPhoto = photo.file?.path ?? null;
  const photoPath = newPhoto ?? (p.photo_path as string | null);

  const r1 = await admin.from("practitioners").update({
    ...profileColumns(profile),
    ...(firstName ? { first_name: firstName } : {}),
    ...(lastName ? { last_name: lastName } : {}),
    status: "pending",
    photo_path: photoPath,
    photo_public: wantsPhoto && !!photoPath,
  }).eq("id", id);
  if (r1.error) {
    console.error("Modification (profil) :", r1.error.message);
    await cleanup();
    return fail("save_failed", 500);
  }

  await admin.from("practitioner_contacts").delete().eq("practitioner_id", id);
  const r2 = await admin.from("practitioner_contacts").insert(buildContacts(profile).map((c) => ({ practitioner_id: id, ...c })));
  const r3 = await admin.from("consents").insert({
    practitioner_id: id, terms_version: VERSION, privacy_version: VERSION, published_fields: profile.pub,
    accuracy_confirmed: true, photo_rights_confirmed: fd.get("photoRights") === "on" || !!(p.photo_path),
  });
  const line = `${new Date().toLocaleDateString("fr-FR")} — corrections envoyées par la personne`;
  const r4 = await admin.from("practitioner_private").update({
    ...(idDoc.file ? { id_document_path: idDoc.file.path } : {}),
    applicant_message: null,
    internal_notes: [found.notes, line].filter(Boolean).join("\n"),
  }).eq("practitioner_id", id);
  const failed = [r2, r3, r4].find((r) => r.error);
  if (failed?.error) console.error("Modification (détails) :", failed.error.message);

  // Anciens fichiers remplacés : supprimés
  const old: string[] = [];
  if (newPhoto && p.photo_path) old.push(p.photo_path as string);
  if (idDoc.file && found.idDocumentPath) old.push(found.idDocumentPath);
  if (old.length) await admin.storage.from("private-submissions").remove(old);

  await admin.from("audit_logs").insert({ actor_role: "applicant", action: "applicant.resubmit", target_type: "practitioner", target_id: id });
  return NextResponse.json({ ok: true, mode: "resubmitted" });
}
