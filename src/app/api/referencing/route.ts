import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { slugify } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PUBLISHABLE = new Set(["photo", "phone", "whatsapp", "social"]);
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const VERSION = "2026-10-provisoire";

type Upload = { path: string; buffer: Buffer; mime: string };
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

// Reconnaît le vrai type d'un fichier d'après son contenu (et non son nom).
function sniff(b: Buffer): string | null {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.length > 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (b.length > 5 && b.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  return null;
}

const text = (fd: FormData, key: string, max: number) => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};

function url(fd: FormData, key: string): string | null {
  const v = text(fd, key, 200);
  if (!v) return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

async function readFile(
  fd: FormData, key: string, folder: string, name: string, allowPdf: boolean, maxBytes: number,
): Promise<{ ok: true; file: Upload | null } | { ok: false }> {
  const f = fd.get(key);
  if (!(f instanceof File) || f.size === 0) return { ok: true, file: null };
  if (f.size > maxBytes) return { ok: false };
  const buffer = Buffer.from(await f.arrayBuffer());
  const mime = sniff(buffer);
  if (!mime || (mime === "application/pdf" && !allowPdf)) return { ok: false };
  return { ok: true, file: { path: `${folder}/${name}.${EXT[mime]}`, buffer, mime } };
}

// POST /api/referencing : enregistre une demande de référencement (statut « en attente »).
// Rien n'est publié automatiquement. Le nom civil reste privé : seul le nom de praticien ou de dignitaire sera affiché.
export async function POST(request: NextRequest) {
  if (!(await rateLimit(request, "referencing", 6, 3600))) return fail("too_many", 429);
  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return fail("invalid_form");
  }

  // Robots : champ piège rempli ou formulaire envoyé trop vite (moins de 10 s) / trop tard (plus de 6 h)
  const started = Number(text(fd, "startedAt", 20));
  const elapsed = Date.now() - started;
  if (text(fd, "company", 100) !== "" || !Number.isFinite(started) || elapsed < 10_000 || elapsed > 6 * 3600_000) {
    return fail("rejected");
  }

  const firstName = text(fd, "firstName", 80);
  const lastName = text(fd, "lastName", 80);
  const spiritualName = text(fd, "spiritualName", 120); // nom affiché publiquement
  const country = text(fd, "country", 60);
  const city = text(fd, "city", 80);
  const title = text(fd, "title", 120);
  const category = text(fd, "category", 40);
  const tradition = text(fd, "tradition", 120);
  const specialties = text(fd, "specialty", 200).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8);
  const years = Number.parseInt(text(fd, "years", 3), 10);
  const bio = text(fd, "bio", 2000);
  const deities = text(fd, "deities", 200);
  const email = text(fd, "email", 200).toLowerCase();
  const phone = text(fd, "phone", 30);
  const whatsapp = text(fd, "whatsapp", 30);
  const pub = new Set(fd.getAll("pub").filter((v): v is string => typeof v === "string" && PUBLISHABLE.has(v)));

  if (!firstName || !lastName || spiritualName.length < 2 || !country || !city || !title || !tradition || specialties.length === 0 ||
      !UUID.test(category) || !Number.isInteger(years) || years < 0 || years > 80 || bio.length < 30 ||
      !EMAIL.test(email) || phone.replace(/\D/g, "").length < 7 || phone.replace(/\D/g, "").length > 15 ||
      (whatsapp && (whatsapp.replace(/\D/g, "").length < 7 || whatsapp.replace(/\D/g, "").length > 15))) {
    return fail("invalid_field");
  }
  if (fd.get("terms") !== "on" || fd.get("privacy") !== "on" || fd.get("accuracy") !== "on") {
    return fail("consent_required");
  }

  const id = randomUUID();
  const folder = `submissions/${id}`;
  const photo = await readFile(fd, "photo", folder, "photo", false, 1_500_000);
  const idDoc = await readFile(fd, "idDoc", folder, "identity", true, 2_500_000);
  const card = await readFile(fd, "memberCard", folder, "member-card", true, 2_500_000);
  if (!photo.ok || !idDoc.ok || !card.ok || !idDoc.file) return fail("invalid_file");
  if (photo.file && fd.get("photoRights") !== "on") return fail("photo_rights");

  const admin = createAdminClient();

  // Freins contre les envois en masse : plafond global par heure, et limite par adresse e-mail
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 3600_000).toISOString();
  const [recent, sameEmail] = await Promise.all([
    admin.from("practitioners").select("id", { count: "exact", head: true }).gte("submitted_at", hourAgo),
    admin.from("practitioner_private").select("practitioner_id", { count: "exact", head: true }).eq("email", email).gte("created_at", dayAgo),
  ]);
  if ((recent.count ?? 0) >= 40 || (sameEmail.count ?? 0) >= 3) return fail("too_many", 429);

  const uploaded: string[] = [];
  const cleanup = async () => {
    if (uploaded.length) await admin.storage.from("private-submissions").remove(uploaded);
    await admin.from("practitioners").delete().eq("id", id);
  };

  for (const f of [photo.file, idDoc.file, card.file]) {
    if (!f) continue;
    const { error } = await admin.storage.from("private-submissions").upload(f.path, f.buffer, { contentType: f.mime, upsert: false });
    if (error) {
      console.error("Référencement (envoi fichier) :", error.message);
      await cleanup();
      return fail("storage_failed", 500);
    }
    uploaded.push(f.path);
  }

  const code = "HWX-" + Array.from(randomBytes(8), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
  // L'adresse de la fiche est construite à partir du nom PUBLIC, jamais du nom civil.
  const slug = `${slugify(spiritualName)}-${randomBytes(2).toString("hex")}`;

  const { error: e1 } = await admin.from("practitioners").insert({
    id, slug, first_name: firstName, last_name: lastName, spiritual_name: spiritualName, title,
    category_id: category, specialties, years_declared: years, bio, country, city, status: "pending",
    photo_path: photo.file?.path ?? null, photo_public: pub.has("photo") && !!photo.file,
  });
  if (e1) {
    console.error("Référencement (profil) :", e1.message);
    await cleanup();
    return fail(e1.code === "23503" ? "invalid_field" : "save_failed", e1.code === "23503" ? 400 : 500);
  }

  const contacts = [{ kind: "phone", value: phone, is_public: pub.has("phone") }];
  if (whatsapp) contacts.push({ kind: "whatsapp", value: whatsapp, is_public: pub.has("whatsapp") });
  for (const kind of ["facebook", "instagram", "tiktok", "x", "website"]) {
    const v = url(fd, kind);
    if (v) contacts.push({ kind, value: v, is_public: pub.has("social") });
  }

  const results = await Promise.all([
    admin.from("practitioner_private").insert({
      practitioner_id: id, email, id_document_path: idDoc.file.path, member_card_path: card.file?.path ?? null,
      internal_notes: `Tradition déclarée : ${tradition}${deities ? `\nDivinités associées déclarées : ${deities}` : ""}`,
      tracking_code_hash: createHash("sha256").update(code).digest("hex"),
    }),
    admin.from("practitioner_contacts").insert(contacts.map((c) => ({ practitioner_id: id, ...c }))),
    admin.from("consents").insert({
      practitioner_id: id, terms_version: VERSION, privacy_version: VERSION, published_fields: [...pub],
      accuracy_confirmed: true, photo_rights_confirmed: !!photo.file,
    }),
  ]);
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error("Référencement (détails) :", failed.error.message);
    await cleanup();
    return fail("save_failed", 500);
  }

  return NextResponse.json({ code });
}
