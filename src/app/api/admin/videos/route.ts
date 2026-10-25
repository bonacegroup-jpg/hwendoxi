import { NextResponse, type NextRequest } from "next/server";
import { getStaff } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { youtubeId } from "@/lib/youtube";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const err = (error: string, status = 400) => NextResponse.json({ error }, { status });

async function authorize(superAdminOnly = false) {
  const staff = await getStaff();
  if (!staff) return null;
  if (superAdminOnly ? staff.role !== "super_admin" : staff.role !== "super_admin" && staff.role !== "editor") return null;
  return staff;
}

function parse(body: Record<string, unknown>) {
  const str = (k: string, max: number) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : "");
  const titleFr = str("titleFr", 200);
  const yt = youtubeId(str("youtubeUrl", 300));
  if (titleFr.length < 3) return { error: "invalid_request" as const };
  if (!yt) return { error: "invalid_url" as const };
  const pair = (fr: string, en: string) => {
    const o: Record<string, string> = {};
    if (fr) o.fr = fr;
    if (en) o.en = en;
    return Object.keys(o).length ? o : null;
  };
  return {
    value: {
      youtube_id: yt,
      title: pair(titleFr, str("titleEn", 200)),
      description: pair(str("descFr", 3000), str("descEn", 3000)),
      status: ["draft", "published", "archived"].includes(str("status", 20)) ? str("status", 20) : "draft",
      id: typeof body.id === "string" ? body.id : "",
    },
  };
}

const audit = (staff: { user: { id: string }; role: string }, action: string, id: string, details?: Record<string, unknown>) =>
  createAdminClient().from("audit_logs").insert({ actor_id: staff.user.id, actor_role: staff.role, action, target_type: "video", target_id: id, details: details ?? null });

// POST : ajouter une vidéo YouTube
export async function POST(request: NextRequest) {
  const staff = await authorize();
  if (!staff) return err("forbidden", 403);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const p = body ? parse(body) : null;
  if (!p) return err("invalid_request");
  if (p.error !== undefined || !p.value) return err(p.error ?? "invalid_request");
  const v = p.value;

  const { count } = await staff.supabase.from("videos").select("id", { count: "exact", head: true }).eq("youtube_id", v.youtube_id);
  if ((count ?? 0) > 0) return err("duplicate", 409);

  const { data, error } = await staff.supabase.from("videos").insert({
    youtube_id: v.youtube_id, title: v.title, description: v.description, status: v.status,
    published_at: v.status === "published" ? new Date().toISOString() : null,
  }).select("id").single();
  if (error || !data) {
    console.error("Vidéo (création) :", error?.message);
    return err("save_failed", 500);
  }
  await audit(staff, "video.create", data.id as string, { status: v.status });
  return NextResponse.json({ ok: true, id: data.id });
}

// PUT : modifier
export async function PUT(request: NextRequest) {
  const staff = await authorize();
  if (!staff) return err("forbidden", 403);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const p = body ? parse(body) : null;
  if (!p) return err("invalid_request");
  if (p.error !== undefined || !p.value) return err(p.error ?? "invalid_request");
  const v = p.value;
  if (!UUID.test(v.id)) return err("invalid_request");

  const { data: current } = await staff.supabase.from("videos").select("status, published_at").eq("id", v.id).maybeSingle();
  if (!current) return err("not_found", 404);
  const { data: same } = await staff.supabase.from("videos").select("id").eq("youtube_id", v.youtube_id).neq("id", v.id).limit(1);
  if ((same ?? []).length > 0) return err("duplicate", 409);

  const { error } = await staff.supabase.from("videos").update({
    youtube_id: v.youtube_id, title: v.title, description: v.description, status: v.status,
    published_at: v.status === "published" ? (current.published_at ?? new Date().toISOString()) : current.published_at,
  }).eq("id", v.id);
  if (error) {
    console.error("Vidéo (modification) :", error.message);
    return err("save_failed", 500);
  }
  await audit(staff, "video.update", v.id, { from: current.status, to: v.status });
  return NextResponse.json({ ok: true });
}

// DELETE : supprimer (super-administrateur seulement)
export async function DELETE(request: NextRequest) {
  const staff = await authorize(true);
  if (!staff) return err("forbidden", 403);
  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!UUID.test(id)) return err("invalid_request");
  const { error } = await staff.supabase.from("videos").delete().eq("id", id);
  if (error) return err("delete_failed", 500);
  await audit(staff, "video.delete", id);
  return NextResponse.json({ ok: true });
}
