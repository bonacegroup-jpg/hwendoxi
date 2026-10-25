// Adresse publique d'un fichier stocké dans l'espace « public-media » de Supabase.
// Seuls les chemins « photos/… » (photos de praticiens validées), « events/… » (affiches)
// et « content/… » (images des articles, documents et fiches) deviennent des adresses : jamais les fichiers privés.
export function publicMediaUrl(path: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !base || !(path.startsWith("photos/") || path.startsWith("events/") || path.startsWith("content/"))) return null;
  return `${base}/storage/v1/object/public/public-media/${path}`;
}
