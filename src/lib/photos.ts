import { randomBytes } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

// Copie une photo privée vers l'espace public (nom unique pour éviter les anciennes versions en cache).
export async function publishPhoto(admin: Admin, id: string, path: string): Promise<string | null> {
  const { data: blob, error } = await admin.storage.from("private-submissions").download(path);
  if (error || !blob) return null;
  const dest = `photos/${id}-${randomBytes(3).toString("hex")}.${path.split(".").pop() ?? "jpg"}`;
  const { error: upErr } = await admin.storage.from("public-media").upload(dest, blob, { contentType: blob.type || "image/jpeg", upsert: false });
  return upErr ? null : dest;
}
