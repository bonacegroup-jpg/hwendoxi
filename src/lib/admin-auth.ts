import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "super_admin" | "verifier" | "editor";

export const ROLE_LABEL: Record<StaffRole, string> = {
  super_admin: "Super-administrateur",
  verifier: "Vérificateur",
  editor: "Éditeur",
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "En attente de validation",
  needs_changes: "Corrections demandées",
  approved: "Validé",
  rejected: "Refusé",
  suspended: "Suspendu",
};

// Retourne la personne connectée SEULEMENT si : session valide + double authentification validée
// + compte présent dans l'équipe (table profiles). Sinon : null.
export async function getStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") return null;

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  if (!profile) return null;

  return { supabase, user, role: profile.role as StaffRole, name: String(profile.full_name) };
}

// Pour les pages : renvoie vers la connexion, ou vers le tableau de bord si le rôle ne suffit pas.
export async function requireStaff(allowed?: StaffRole[]) {
  const staff = await getStaff();
  if (!staff) redirect("/admin/connexion");
  if (allowed && !allowed.includes(staff.role)) redirect("/admin");
  return staff;
}
