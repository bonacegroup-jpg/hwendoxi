// Types partagés entre le serveur (API de recherche) et l'interface.

export type PractitionerCard = {
  id: string;
  slug: string;
  name: string;
  spiritualName: string | null;
  title: string;
  country: string;
  city: string;
  specialty: string;
  level: 1 | 2 | 3;
  years: number | null;
  phone: string | null; // renseigné uniquement si le praticien a autorisé sa publication
};

export type SearchResponse = {
  items: PractitionerCard[];
  total: number;
  page: number;
  pageSize: number;
};

export type CategoryOption = { id: string; name: string };
