// Adresse publique du site (pour le plan du site, les liens canoniques et le partage).
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

// Le site n'est indexable par Google que si la variable SITE_INDEXING vaut "on" (réglée dans Vercel).
export const indexingEnabled = process.env.SITE_INDEXING === "on";
