const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PUBLISHABLE = new Set(["photo", "phone", "whatsapp", "social"]);
const SOCIALS = ["facebook", "instagram", "tiktok", "x", "website"] as const;

export type ProfilePayload = {
  spiritualName: string;
  title: string;
  category: string;
  specialties: string[];
  years: number;
  bio: string;
  country: string;
  city: string;
  phone: string;
  whatsapp: string;
  socials: Record<string, string>;
  pub: string[];
};

export const text = (fd: FormData, key: string, max: number) => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};

const digits = (s: string) => s.replace(/\D/g, "");

function cleanUrl(v: string): string | null {
  if (!v) return null;
  try {
    const u = new URL(v.slice(0, 200));
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

// Lit et contrôle les informations du profil envoyées par un formulaire. Retourne null si elles sont invalides.
export function parseProfile(fd: FormData): ProfilePayload | null {
  const spiritualName = text(fd, "spiritualName", 120);
  const title = text(fd, "title", 120);
  const category = text(fd, "category", 40);
  const specialties = text(fd, "specialty", 200).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8);
  const years = Number.parseInt(text(fd, "years", 3), 10);
  const bio = text(fd, "bio", 2000);
  const country = text(fd, "country", 60);
  const city = text(fd, "city", 80);
  const phone = text(fd, "phone", 30);
  const whatsapp = text(fd, "whatsapp", 30);

  if (spiritualName.length < 2 || !title || !country || !city || specialties.length === 0 || !UUID.test(category) ||
      !Number.isInteger(years) || years < 0 || years > 80 || bio.length < 30 ||
      digits(phone).length < 7 || digits(phone).length > 15 ||
      (whatsapp && (digits(whatsapp).length < 7 || digits(whatsapp).length > 15))) {
    return null;
  }
  const socials: Record<string, string> = {};
  for (const k of SOCIALS) {
    const u = cleanUrl(text(fd, k, 200));
    if (u) socials[k] = u;
  }
  const pub = Array.from(new Set(fd.getAll("pub").filter((v): v is string => typeof v === "string" && PUBLISHABLE.has(v))));
  return { spiritualName, title, category, specialties, years, bio, country, city, phone, whatsapp, socials, pub };
}

export function buildContacts(p: ProfilePayload) {
  const rows = [{ kind: "phone", value: p.phone, is_public: p.pub.includes("phone") }];
  if (p.whatsapp) rows.push({ kind: "whatsapp", value: p.whatsapp, is_public: p.pub.includes("whatsapp") });
  for (const [kind, value] of Object.entries(p.socials)) rows.push({ kind, value, is_public: p.pub.includes("social") });
  return rows;
}

export const profileColumns = (p: ProfilePayload) => ({
  spiritual_name: p.spiritualName, title: p.title, category_id: p.category, specialties: p.specialties,
  years_declared: p.years, bio: p.bio, country: p.country, city: p.city,
});
