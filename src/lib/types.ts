// Types partagés entre le serveur (API de recherche) et l'interface.

export type PractitionerCard = {
  id: string;
  slug: string;
  name: string; // nom de praticien ou de dignitaire (le nom civil n'est jamais public)
  title: string;
  country: string;
  city: string;
  specialty: string;
  level: 1 | 2 | 3;
  years: number | null;
  phone: string | null; // renseigné uniquement si le praticien a autorisé sa publication
  photoUrl: string | null; // renseigné uniquement si le praticien a autorisé la publication de sa photo
};

export type SearchResponse = {
  items: PractitionerCard[];
  total: number;
  page: number;
  pageSize: number;
};

export type CategoryOption = { id: string; name: string };
