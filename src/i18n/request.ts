import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);

// Fusionne les fichiers de textes : un fichier plus récent peut compléter ou remplacer une clé précise.
function merge(a: Json, b: Json): Json {
  const out: Json = { ...a };
  for (const [key, value] of Object.entries(b)) {
    const current = out[key];
    out[key] = isObject(value) && isObject(current) ? merge(current, value) : value;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const [base, form, deities, names, sections] = await Promise.all([
    import(`../../messages/${locale}.json`),
    import(`../../messages/form.${locale}.json`),
    import(`../../messages/deities.${locale}.json`),
    import(`../../messages/names.${locale}.json`),
    import(`../../messages/sections.${locale}.json`),
  ]);

  const messages = [form.default, deities.default, names.default, sections.default].reduce<Json>(
    (acc, file) => merge(acc, file as Json),
    base.default as Json,
  );
  return { locale, messages };
});
