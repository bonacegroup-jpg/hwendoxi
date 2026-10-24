// Les heures des événements sont saisies comme « heure locale du lieu » : on les stocke et on les affiche
// telles quelles (fuseau UTC utilisé uniquement comme convention d'enregistrement).
const loc = (locale: string) => (locale === "fon" || locale === "yo" ? "fr" : locale);

export function formatEventDate(iso: string, locale: string, withTime = true): string {
  return new Intl.DateTimeFormat(loc(locale), {
    dateStyle: "long",
    ...(withTime ? { timeStyle: "short" as const } : {}),
    timeZone: "UTC",
  }).format(new Date(iso));
}

export type EventState = "upcoming" | "ongoing" | "past";

export function eventState(start: string, end: string | null, now: number = Date.now()): EventState {
  const startMs = Date.parse(start);
  const endMs = end ? Date.parse(end) : Date.parse(`${start.slice(0, 10)}T23:59:59Z`);
  if (now < startMs) return "upcoming";
  if (now <= endMs) return "ongoing";
  return "past";
}
