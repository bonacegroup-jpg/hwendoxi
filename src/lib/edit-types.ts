export type EditableProfile = {
  firstName: string;
  lastName: string;
  spiritualName: string;
  title: string;
  categoryId: string;
  specialty: string;
  years: number | null;
  bio: string;
  country: string;
  city: string;
  phone: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  x: string;
  website: string;
  pub: string[];
};

export type AccessResponse = {
  status: string;
  message: string | null;
  canEdit: boolean;
  pendingChange: boolean;
  hasIdDocument: boolean;
  profile: EditableProfile;
};
