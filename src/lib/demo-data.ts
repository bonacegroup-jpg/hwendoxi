// DONNÉES FICTIVES — uniquement pour le développement.
// Elles seront remplacées par la base de données Supabase (Phase 4).

export type VerificationLevel = 1 | 2 | 3;

export type Practitioner = {
  id: string;
  name: string;
  spiritualName: string;
  title: string;
  country: string;
  city: string;
  specialty: string;
  level: VerificationLevel;
  years: number;
  phone: string | null; // null = numéro non autorisé à la publication
};

export const LEVELS: Record<VerificationLevel, string> = {
  1: "Identité examinée",
  2: "Appartenance documentée",
  3: "Dossier approfondi",
};

export const PRACTITIONERS: Practitioner[] = [
  { id: "adjoa-demo", name: "Adjoa Démo", spiritualName: "Nom spirituel (démo) 1", title: "Prêtresse traditionnelle", country: "Bénin", city: "Ouidah", specialty: "Connaissance des plantes", level: 1, years: 12, phone: "+229 00 00 00 01" },
  { id: "kossi-demo", name: "Kossi Démo", spiritualName: "Nom spirituel (démo) 2", title: "Babalawo", country: "Nigeria", city: "Ibadan", specialty: "Divination Ifá", level: 2, years: 20, phone: "+234 00 00 00 02" },
  { id: "ayaba-demo", name: "Ayaba Démo", spiritualName: "Nom spirituel (démo) 3", title: "Praticienne du Fa", country: "Togo", city: "Aného", specialty: "Conseil et médiation", level: 3, years: 8, phone: null },
];
