import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getStaff } from "@/lib/admin-auth";
import { slugify } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const err = (error: string, status = 400) => NextResponse.json({ error }, { status });
const hex = () => randomBytes(2).toString("hex");

async function authorize(superAdminOnly = false) {
  const staff = await getStaff();
  if (!staff) return null;
  if (superAdminOnly ? staff.role !== "super_admin" : staff.role !== "super_admin" && staff.role !== "editor") return null;
  return staff;
}

function parse(body: Record<string, unknown>) {
  const str = (k: string, max: number) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : "");
  const titleFr = str("titleFr", 200);
  const kind = str("kind", 20);
  if (titleFr.length < 3 || !["documentation", "news"].includes(kind)) return null;
  const cover = str("coverPath", 200);
  if (cover && !/^content\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(cover)) return null;
  const pair = (fr: string, en: string) => {
    const o: Record<string, string> = {};
    if (fr) o.fr = fr;
    if (en) o.en = en;
    return Object.keys(o).length ? o : null;
  };
  return {
    kind,
    cover: cover || null,
    titleFr,
    title: pair(titleFr, str("titleEn", 200)),
    summary: pair(str("summaryFr", 400), str("summaryEn", 400)),
    body: pair(str("bodyFr", 30000), str("bodyEn", 30000)),
    status: ["draft", "published", "archived"].includes(str("status", 20)) ? str("status", 20) : "draft",
    id: typeof body.id === "string" ? body.id : "",
  };
}

const audit = (staff: { user: { id: string }; role: string }, action: string, id: string, details?: Record<string, unknown>) =>
  createAdminClient().from("audit_logs").insert({ actor_id: staff.user.id, actor_role: staff.role, action, target_type: "article", target_id: id, details: details ?? null });

// POST : créer un document ou une actualité
export async function POST(request: NextRequest) {
  const staff = await authorize();
  if (!staff) return err("forbidden", 403);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const v = body && parse(body);
  if (!v) return err("invalid_request");

  const { data, error } = await staff.supabase.from("articles").insert({
    slug: `${slugify(v.titleFr)}-${hex()}`, kind: v.kind, title: v.title, summary: v.summary, body: v.body, status: v.status, cover_path: v.cover,
    author_id: staff.user.id, published_at: v.status === "published" ? new Date().toISOString() : null,
  }).select("id").single();
  if (error || !data) {
    console.error("Article (création) :", error?.message);
    return err("save_failed", 500);
  }
  await audit(staff, "article.create", data.id as string, { kind: v.kind, status: v.status });
  return NextResponse.json({ ok: true, id: data.id });
}

// PUT : modifier
export async function PUT(request: NextRequest) {
  const staff = await authorize();
  if (!staff) return err("forbidden", 403);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const v = body && parse(body);
  if (!v || !UUID.test(v.id)) return err("invalid_request");

  const { data: current } = await staff.supabase.from("articles").select("status, published_at").eq("id", v.id).maybeSingle();
  if (!current) return err("not_found", 404);

  const { error } = await staff.supabase.from("articles").update({
    kind: v.kind, title: v.title, summary: v.summary, body: v.body, status: v.status, cover_path: v.cover,
    published_at: v.status === "published" ? (current.published_at ?? new Date().toISOString()) : current.published_at,
  }).eq("id", v.id);
  if (error) {
    console.error("Article (modification) :", error.message);
    return err("save_failed", 500);
  }
  await audit(staff, "article.update", v.id, { from: current.status, to: v.status });
  return NextResponse.json({ ok: true });
}

// DELETE : supprimer (super-administrateur seulement)
export async function DELETE(request: NextRequest) {
  const staff = await authorize(true);
  if (!staff) return err("forbidden", 403);
  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!UUID.test(id)) return err("invalid_request");
  const { error } = await staff.supabase.from("articles").delete().eq("id", id);
  if (error) return err("delete_failed", 500);
  await audit(staff, "article.delete", id);
  return NextResponse.json({ ok: true });
}
