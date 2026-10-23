"use client";

import { createClient } from "@/lib/supabase/browser";
import { btnGhost } from "@/lib/ui";

export default function LogoutButton() {
  async function logout() {
    await createClient().auth.signOut();
    window.location.href = "/admin/connexion";
  }
  return (
    <button type="button" className={`${btnGhost} !px-4 !py-1.5 text-sm`} onClick={logout}>
      Se déconnecter
    </button>
  );
}
