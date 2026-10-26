import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getStaff } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { EXT, sniff } from "@/lib/uploads";

export const runtime = "nodejs";
export const maxDuration = 30;

// POST /api/admin/upload-image (multipart, champ « image ») : enregistre une image de contenu
// (actualité, document, fiche de divinité) dans l'espace public. Réservé aux éditeurs et au super-administrateur.
export async function POST(request: NextRequest) {
  const staff = await getStaff();
  if (!staff || (staff.role !== "super_admin" && staff.role !== "editor")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const fd = await request.formData().catch(() => null);
  const file = fd?.get("image");
  if (!(file instanceof File) || file.size === 0 || file.size > 2_000_000) {
    return NextResponse.json({ error: "invalid_image" }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = sniff(buffer);
  if (!mime || mime === "application/pdf") return NextResponse.json({ error: "invalid_image" }, { status: 400 });

  const path = `content/${randomUUID()}.${EXT[mime]}`;
  const { error } = await createAdminClient().storage.from("public-media").upload(path, buffer, { contentType: mime, upsert: false });
  if (error) {
    console.error("Image de contenu :", error.message);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
  return NextResponse.json({ path });
}
