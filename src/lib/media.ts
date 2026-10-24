// Adresse publique d'une photo stockée dans l'espace « public-media » de Supabase.
// Seuls les chemins « photos/… » (photos validées et autorisées à la publication) deviennent des adresses.
export function publicMediaUrl(path: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !base || !path.startsWith("photos/")) return null;
  return `${base}/storage/v1/object/public/public-media/${path}`;
}
