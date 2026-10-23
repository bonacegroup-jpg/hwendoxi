import { createClient } from "@supabase/supabase-js";

// Client Supabase « administrateur » : il contourne les règles de sécurité de la base.
// À utiliser UNIQUEMENT dans du code serveur (routes /api), jamais dans un composant client.
// La clé secrète vient de la variable SUPABASE_SECRET_KEY (sans préfixe NEXT_PUBLIC_).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error("Variable SUPABASE_SECRET_KEY manquante (Vercel > Settings > Environment Variables).");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
