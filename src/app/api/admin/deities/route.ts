import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getStaff } from "@/lib/admin-auth";
import { slugify } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const err = (error: string, status = 400) => NextResponse.json({ error }, { status });
const suffix = () => randomBytes(2).toString("hex");

async function authorize(needSuperAdmin = false) {
  const staff = await getStaff();
  if (!staff) return null;
  if (needSuperAdmin ? staff.role !== "super_admin" : staff.role !== "super_admin" && staff.role !== "editor") return null;
  return staff;
}

function parse(body: Record<string, unknown>) {
  const str = (k: string, max: number) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : "");
  const name = str("name", 120);
  if (name.length < 2) return null;
  const imagePath = str("imagePath", 200);
  if (imagePath && !/^content\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(imagePath)) return null;
  const status = ["draft", "published", "archived"].includes(str("status", 20)) ? str("status", 20) : "draft";
  const sources = str("sources", 6000)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((line) => {
      const parts = line.split("|");
      const first = parts[0].trim().slice(0, 200);
      if (parts.length === 1) return { title: first, url: /^https?:\/\//i.test(first) ? first : null };
      const url = parts.slice(1).join("|").trim();
      return { title: first, url: /^https?:\/\//i.test(url) ? url.slice(0, 300) : null };
    })
    .filter((s) => s.title);
  const description: Record<string, string> = {};
  if (str("descFr", 5000)) description.fr = str("descFr", 5000);
  if (str("descEn", 5000)) description.en = str("descEn", 5000);

  return {
    name,
    other_names: str("otherNames", 800).split(",").map((s) => s.trim().slice(0, 80)).filter(Boolean).slice(0, 10),
    region: str("region", 120) || null,
    description: Object.keys(description).length ? description : null,
    sources,
    status,
    image_path: imagePath || null,
    traditionId: str("traditionId", 40),
    newTradition: str("newTradition", 120),
  };
}

async function resolveTradition(staff: NonNullable<Awaited<ReturnType<typeof authorize>>>, traditionId: string, newTradition: string) {
  if (newTradition) {
    const { data, error } = await staff.supabase
      .from("traditions")
      .insert({ slug: `${slugify(newTradition)}-${suffix()}`, name: { fr: newTradition } })
      .select("id")
      .single();
    if (error || !data) return { error: true as const };
    return { id: data.id as string };
  }
  return { id: UUID.test(traditionId) ? traditionId : null };
}

const audit = (staff: { user: { id: string }; role: string }, action: string, id: string, details?: Record<string, unknown>) =>
  createAdminClient().from("audit_logs").insert({ actor_id: staff.user.id, actor_role: staff.role, action, target_type: "deity", target_id: id, details: details ?? null });

// POST : créer une fiche (super-administrateur et éditeurs)
export async function POST(request: NextRequest) {
  const staff = await authorize();
  if (!staff) return err("forbidden", 403);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const p = body && parse(body);
  if (!p) return err("invalid_request");

  const t = await resolveTradition(staff, p.traditionId, p.newTradition);
  if ("error" in t) return err("tradition_failed", 500);

  const { data, error } = await staff.supabase
    .from("deities")
    .insert({
      slug: `${slugify(p.name)}-${suffix()}`, name: p.name, other_names: p.other_names, region: p.region, description: p.description,
      sources: p.sources, status: p.status, tradition_id: t.id, image_path: p.image_path, published_at: p.status === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("Divinité (création) :", error?.message);
    return err("save_failed", 500);
  }
  await audit(staff, "deity.create", data.id as string, { status: p.status });
  return NextResponse.json({ ok: true, id: data.id });
}

// PUT : modifier une fiche
export async function PUT(request: NextRequest) {
  const staff = await authorize();
  if (!staff) return err("forbidden", 403);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const p = body && parse(body);
  const id = body && typeof body.id === "string" ? body.id : "";
  if (!p || !UUID.test(id)) return err("invalid_request");

  const { data: current } = await staff.supabase.from("deities").select("status, published_at").eq("id", id).maybeSingle();
  if (!current) return err("not_found", 404);

  const t = await resolveTradition(staff, p.traditionId, p.newTradition);
  if ("error" in t) return err("tradition_failed", 500);

  const { error } = await staff.supabase
    .from("deities")
    .update({
      name: p.name, other_names: p.other_names, region: p.region, description: p.description, sources: p.sources,
      status: p.status, tradition_id: t.id, image_path: p.image_path,
      published_at: p.status === "published" ? (current.published_at ?? new Date().toISOString()) : current.published_at,
    })
    .eq("id", id);
  if (error) {
    console.error("Divinité (modification) :", error.message);
    return err("save_failed", 500);
  }
  await audit(staff, "deity.update", id, { from: current.status, to: p.status });
  return NextResponse.json({ ok: true });
}

// DELETE : supprimer une fiche (super-administrateur seulement)
export async function DELETE(request: NextRequest) {
  const staff = await authorize(true);
  if (!staff) return err("forbidden", 403);
  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  const id = body && typeof body.id === "string" ? body.id : "";
  if (!UUID.test(id)) return err("invalid_request");

  const { error } = await staff.supabase.from("deities").delete().eq("id", id);
  if (error) {
    console.error("Divinité (suppression) :", error.message);
    return err("delete_failed", 500);
  }
  await audit(staff, "deity.delete", id);
  return NextResponse.json({ ok: true });
}
