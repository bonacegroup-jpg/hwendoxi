export type LText = Record<string, string> | null;

// Choisit le texte dans la langue du visiteur, avec le français en secours.
export const pickText = (t: LText, locale: string) => (t ? (t[locale] ?? t.fr ?? "") : "");

export type EventRow = {
  slug: string;
  title: LText;
  description: LText;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  organizer: string | null;
  contact: string | null;
  registration_url: string | null;
  image_path: string | null;
};

export const EVENT_COLUMNS = "slug, title, description, starts_at, ends_at, location, organizer, contact, registration_url, image_path";
