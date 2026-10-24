// Transforme un titre en adresse lisible : « Divinité Démo » -> « divinite-demo »
export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "fiche";
