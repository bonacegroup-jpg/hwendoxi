import { defineRouting } from "next-intl/routing";

// Langues ouvertes au public. Le yoruba ("yo") et le fon ("fon") seront ajoutés
// ici UNIQUEMENT après relecture de leurs traductions par des locuteurs natifs.
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
});
