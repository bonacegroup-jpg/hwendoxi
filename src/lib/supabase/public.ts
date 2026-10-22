import { createClient } from "@supabase/supabase-js";

// Client Supabase pour les données PUBLIQUES (lecture seule, sans connexion).
// Il utilise uniquement la clé « publishable », qui peut être exposée sans risque :
// ce sont les règles de sécurité (RLS) de la base qui protègent les données.
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Variables Supabase manquantes : vérifiez le fichier .env.local (NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
