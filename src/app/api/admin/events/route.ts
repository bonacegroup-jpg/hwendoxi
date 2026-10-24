import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getStaff } from "@/lib/admin-auth";
import { slugify } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const err = (error: string, status = 400) => NextResponse.json({ error }, { status });
const hex = () => randomBytes(2).toString("hex");

async function authorize(superAdminOnly = false) {
  const staff = await getStaff();
  if (!staff) return null;
  if (superAdminOnly ? staff.role !== "super_admin" : staff.role !== "super_admin" && staff.role !== "editor") return null;
  return staff;
}

function sniffImage(b: Buffer): string | null {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.length > 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

function parse(data: Record<string, unknown>) {
  const str = (k: string, max: number) => (typeof data[k] === "string" ? (data[k] as string).trim().slice(0, max) : "");
  const titleFr = str("titleFr", 200);
  if (titleFr.length < 3 || !DATETIME.test(str("startsAt", 16))) return { error: "invalid_request" as const };
  const endsRaw = str("endsAt", 16);
  if (endsRaw && !DATETIME.test(endsRaw)) return { error: "invalid_request" as const };
  if (endsRaw && endsRaw < str("startsAt", 16)) return { error: "invalid_dates" as const };
  const url = str("registrationUrl", 300);
  if (url && !/^https?:\/\//i.test(url)) return { error: "invalid_url" as const };
  const status = ["draft", "published", "archived"].includes(str("status", 20)) ? str("status", 20) : "draft";
  const text = (fr: string, en: string) => {
    const o: Record<string, string> = {};
    if (fr) o.fr = fr;
    if (en) o.en = en;
    return Object.keys(o).length ? o : null;
  };
  return {
    value: {
      title: text(titleFr, str("titleEn", 200)),
      description: text(str("descFr", 5000), str("descEn", 5000)),
      starts_at: `${str("startsAt", 16)}:00Z`,
      ends_at: endsRaw ? `${endsRaw}:00Z` : null,
      location: str("location", 200) || null,
      organizer: str("organizer", 200) || null,
      contact: str("contact", 200) || null,
      registration_url: url || null,
      status,
      titleFr,
      removeImage: data.removeImage === true,
      id: typeof data.id === "string" ? data.id : "",
    },
  };
}

async function readRequest(request: NextRequest) {
  const fd = await request.formData().catch(() => null);
  if (!fd) return null;
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(String(fd.get("data") ?? "{}")) as Record<string, unknown>;
  } catch {
    return null;
  }
  const image = fd.get("image");
  return { data, image: image instanceof File && image.size > 0 ? image : null };
}

const audit = (staff: { user: { id: string }; role: string }, action: string, id: string, details?: Record<string, unknown>) =>
  createAdminClient().from("audit_logs").insert({ actor_id: staff.user.id, actor_role: staff.role, action, target_type: "event", target_id: id, details: details ?? null });

async function uploadPoster(image: File, id: string): Promise<{ path: string } | { error: true }> {
  if (image.size > 2_000_000) return { error: true };
  const buffer = Buffer.from(await image.arrayBuffer());
  const mime = sniffImage(buffer);
  if (!mime) return { error: true };
  const path = `events/${id}-${hex()}.${EXT[mime]}`;
  const { error } = await createAdminClient().storage.from("public-media").upload(path, buffer, { contentType: mime, upsert: false });
  if (error) {
    console.error("Événement (affiche) :", error.message);
    return { error: true };
  }
  return { path };
}

const removeFile = async (path: string | null) => {
  if (path && path.startsWith("events/")) await createAdminClient().storage.from("public-media").remove([path]);
};

// POST : créer un événement (super-administrateur et éditeurs)
export async function POST(request: NextRequest) {
  const staff = await authorize();
  if (!staff) return err("forbidden", 403);
  const req = await readRequest(request);
  if (!req) return err("invalid_request");
  const p = parse(req.data);
  if ("error" in p) return err(p.error);
  const v = p.value;

  const id = crypto.randomUUID();
  let imagePath: string | null = null;
  if (req.image) {
    const up = await uploadPoster(req.image, id);
    if ("error" in up) return err("invalid_image");
    imagePath = up.path;
  }

  const { error } = await staff.supabase.from("events").insert({
    id, slug: `${slugify(v.titleFr)}-${hex()}`, title: v.title, description: v.description, starts_at: v.starts_at, ends_at: v.ends_at,
    location: v.location, organizer: v.organizer, contact: v.contact, registration_url: v.registration_url, image_path: imagePath, status: v.status,
  });
  if (error) {
    console.error("Événement (création) :", error.message);
    await removeFile(imagePath);
    return err("save_failed", 500);
  }
  await audit(staff, "event.create", id, { status: v.status });
  return NextResponse.json({ ok: true, id });
}

// PUT : modifier un événement
export async function PUT(request: NextRequest) {
  const staff = await authorize();
  if (!staff) return err("forbidden", 403);
  const req = await readRequest(request);
  if (!req) return err("invalid_request");
  const p = parse(req.data);
  if ("error" in p) return err(p.error);
  const v = p.value;
  if (!UUID.test(v.id)) return err("invalid_request");

  const { data: current } = await staff.supabase.from("events").select("status, image_path").eq("id", v.id).maybeSingle();
  if (!current) return err("not_found", 404);

  let imagePath: string | null = current.image_path as string | null;
  const oldPath = imagePath;
  if (req.image) {
    const up = await uploadPoster(req.image, v.id);
    if ("error" in up) return err("invalid_image");
    imagePath = up.path;
  } else if (v.removeImage) {
    imagePath = null;
  }

  const { error } = await staff.supabase.from("events").update({
    title: v.title, description: v.description, starts_at: v.starts_at, ends_at: v.ends_at, location: v.location, organizer: v.organizer,
    contact: v.contact, registration_url: v.registration_url, image_path: imagePath, status: v.status,
  }).eq("id", v.id);
  if (error) {
    console.error("Événement (modification) :", error.message);
    if (req.image) await removeFile(imagePath);
    return err("save_failed", 500);
  }
  if (oldPath && oldPath !== imagePath) await removeFile(oldPath);
  await audit(staff, "event.update", v.id, { from: current.status, to: v.status });
  return NextResponse.json({ ok: true });
}

// DELETE : supprimer un événement (super-administrateur seulement)
export async function DELETE(request: NextRequest) {
  const staff = await authorize(true);
  if (!staff) return err("forbidden", 403);
  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  const id = body && typeof body.id === "string" ? body.id : "";
  if (!UUID.test(id)) return err("invalid_request");

  const { data: current } = await staff.supabase.from("events").select("image_path").eq("id", id).maybeSingle();
  const { error } = await staff.supabase.from("events").delete().eq("id", id);
  if (error) {
    console.error("Événement (suppression) :", error.message);
    return err("delete_failed", 500);
  }
  await removeFile((current?.image_path as string | null) ?? null);
  await audit(staff, "event.delete", id);
  return NextResponse.json({ ok: true });
}
