import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DecisionForm from "@/components/admin/DecisionForm";
import { requireStaff, STATUS_LABEL } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type P = {
  id: string; first_name: string; last_name: string; spiritual_name: string | null; title: string;
  specialties: string[] | null; years_declared: number | null; bio: string | null; country: string; city: string;
  status: string; verification_level: number | null; photo_path: string | null; photo_public: boolean; submitted_at: string;
};
type Priv = { email: string; id_document_path: string | null; member_card_path: string | null; identity_deleted_at: string | null; internal_notes: string | null };
type Contact = { kind: string; value: string; is_public: boolean };
type Consent = { terms_version: string; privacy_version: string; published_fields: string[]; accepted_at: string; photo_rights_confirmed: boolean };

export default async function RequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff(["super_admin", "verifier"]);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data } = await staff.supabase.from("practitioners").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const p = data as P;

  const [priv, contacts, consents] = await Promise.all([
    staff.supabase.from("practitioner_private").select("*").eq("practitioner_id", id).maybeSingle(),
    staff.supabase.from("practitioner_contacts").select("kind, value, is_public").eq("practitioner_id", id),
    staff.supabase.from("consents").select("*").eq("practitioner_id", id),
  ]);
  const pr = priv.data as Priv | null;

  // Liens temporaires (5 minutes) vers les fichiers privés : réservés aux vérificateurs connectés
  const admin = createAdminClient();
  const signed = async (path: string | null) => {
    if (!path) return null;
    const { data: s } = await admin.storage.from("private-submissions").createSignedUrl(path, 300);
    return s?.signedUrl ?? null;
  };
  const [photoUrl, idUrl, cardUrl] = await Promise.all([signed(p.photo_path), signed(pr?.id_document_path ?? null), signed(pr?.member_card_path ?? null)]);

  const row = "grid gap-1 py-2 text-sm md:grid-cols-[220px_1fr]";
  return (
    <AdminShell staff={staff}>
      <p className="mb-3 text-sm"><Link href="/admin/demandes" className="text-gold-dark underline">← Retour aux demandes</Link></p>
      <h1 className="font-serif text-3xl font-bold">{p.first_name} {p.last_name}</h1>
      <p className="mb-6 text-muted">{STATUS_LABEL[p.status] ?? p.status}{p.verification_level ? ` — niveau ${p.verification_level}` : ""}</p>

      <div className="grid gap-6 md:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="mb-2 font-serif text-xl font-bold">Dossier</h2>
          <div className="divide-y divide-line">
            <div className={row}><span className="text-muted">Nom spirituel</span><span>{p.spiritual_name ?? "—"}</span></div>
            <div className={row}><span className="text-muted">Titre</span><span>{p.title}</span></div>
            <div className={row}><span className="text-muted">Lieu</span><span>{p.city}, {p.country}</span></div>
            <div className={row}><span className="text-muted">Spécialités</span><span>{(p.specialties ?? []).join(", ") || "—"}</span></div>
            <div className={row}><span className="text-muted">Années d’exercice</span><span>{p.years_declared ?? "—"}</span></div>
            <div className={row}><span className="text-muted">Présentation</span><span className="whitespace-pre-line">{p.bio ?? "—"}</span></div>
            <div className={row}><span className="text-muted">E-mail (privé)</span><span>{pr?.email ?? "—"}</span></div>
            <div className={row}><span className="text-muted">Notes internes</span><span className="whitespace-pre-line">{pr?.internal_notes ?? "—"}</span></div>
            <div className={row}>
              <span className="text-muted">Coordonnées</span>
              <span className="whitespace-pre-line">{(contacts.data as Contact[] | null)?.map((c) => `${c.kind} : ${c.value} (${c.is_public ? "public" : "privé"})`).join("\n") || "—"}</span>
            </div>
            <div className={row}>
              <span className="text-muted">Consentements</span>
              <span className="whitespace-pre-line">
                {(consents.data as Consent[] | null)?.map((c) => `Conditions ${c.terms_version}, confidentialité ${c.privacy_version}\nPublication autorisée : ${c.published_fields.join(", ") || "aucune"}\nDroits photo confirmés : ${c.photo_rights_confirmed ? "oui" : "non"}\nLe ${new Date(c.accepted_at).toLocaleString("fr-FR")}`).join("\n\n") || "—"}
              </span>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-line bg-white p-6">
            <h2 className="mb-2 font-serif text-xl font-bold">Pièces (privées)</h2>
            {pr?.identity_deleted_at ? (
              <p className="text-sm">Pièces supprimées le {new Date(pr.identity_deleted_at).toLocaleDateString("fr-FR")}, après la décision.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                <li>{idUrl ? <a href={idUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold-dark underline">Ouvrir la pièce d’identité</a> : "Pièce d’identité : aucune"}</li>
                <li>{cardUrl ? <a href={cardUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold-dark underline">Ouvrir la carte de membre</a> : "Carte de membre : non fournie"}</li>
                <li className="text-xs text-muted">Les liens expirent au bout de 5 minutes. Ne les partagez pas.</li>
              </ul>
            )}
            {photoUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="Photo de profil soumise" className="mt-4 max-h-56 rounded-xl border border-line" />
                <p className="mt-1 text-xs text-muted">Publication de la photo : {p.photo_public ? "autorisée" : "non autorisée"}</p>
              </>
            )}
          </section>
          <DecisionForm id={p.id} status={p.status} hasMemberCard={!!pr?.member_card_path} />
        </aside>
      </div>
    </AdminShell>
  );
}
