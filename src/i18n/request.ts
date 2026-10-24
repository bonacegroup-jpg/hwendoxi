import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  // Les textes sont répartis en plusieurs fichiers (général, formulaire, divinités) puis fusionnés.
  const base = (await import(`../../messages/${locale}.json`)).default;
  const form = (await import(`../../messages/form.${locale}.json`)).default;
  const deities = (await import(`../../messages/deities.${locale}.json`)).default;

  return { locale, messages: { ...base, ...form, ...deities } };
});
