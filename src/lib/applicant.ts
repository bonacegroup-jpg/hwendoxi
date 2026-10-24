import { createHash } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

export const hashCode = (code: string) => createHash("sha256").update(code).digest("hex");

// Retrouve un dossier à partir du code de suivi ET de l'adresse e-mail déclarée (les deux doivent correspondre).
export async function findApplicant(admin: Admin, code: string, email: string) {
  const { data } = await admin
    .from("practitioner_private")
    .select("practitioner_id, email, applicant_message, id_document_path, internal_notes")
    .eq("tracking_code_hash", hashCode(code.trim().toUpperCase()))
    .maybeSingle();
  if (!data || String(data.email).toLowerCase() !== email.trim().toLowerCase()) return null;
  return {
    id: data.practitioner_id as string,
    message: (data.applicant_message as string | null) ?? null,
    idDocumentPath: (data.id_document_path as string | null) ?? null,
    notes: (data.internal_notes as string | null) ?? null,
  };
}
