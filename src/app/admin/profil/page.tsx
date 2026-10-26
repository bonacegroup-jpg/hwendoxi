import AdminShell from "@/components/admin/AdminShell";
import ChangePassword from "@/components/admin/ChangePassword";
import { IconUser } from "@/components/admin/icons";
import { requireStaff, ROLE_LABEL, type StaffRole } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const PERMISSIONS: Record<StaffRole, string[]> = {
  super_admin: ["Toutes les rubriques de l’administration", "Gestion des demandes, modifications et signalements", "Gestion des contenus et de la page d’accueil", "Journal d’audit et suppressions"],
  verifier: ["Examen des demandes d’inscription et des pièces d’identité", "Examen des demandes de modification de profils", "Traitement des signalements"],
  editor: ["Gestion des divinités, événements et ressources", "Choix des contenus mis en avant sur la page d’accueil", "Aucun accès aux dossiers ni aux pièces d’identité"],
};

export default async function ProfilePage() {
  const staff = await requireStaff();
  const last = staff.user.last_sign_in_at ? new Date(staff.user.last_sign_in_at).toLocaleString("fr-FR") : "—";

  return (
    <AdminShell staff={staff}>
      <h1 className="mb-6 font-serif text-3xl font-bold">Profil</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-6">
          <div className="mb-4 flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-full bg-sand text-gold-dark"><IconUser /></span>
            <div>
              <p className="font-serif text-xl font-bold">{staff.name}</p>
              <p className="text-sm text-muted">{ROLE_LABEL[staff.role]}</p>
            </div>
          </div>
          <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[160px_1fr]">
            <dt className="text-muted">Adresse e-mail</dt><dd className="break-all">{staff.user.email ?? "—"}</dd>
            <dt className="text-muted">Dernière connexion</dt><dd>{last}</dd>
            <dt className="text-muted">Double authentification</dt><dd>Activée et validée pour cette session</dd>
          </dl>
          <h2 className="mb-2 mt-6 font-serif text-lg font-bold">Vos droits</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {PERMISSIONS[staff.role].map((p) => <li key={p}>{p}</li>)}
          </ul>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="mb-3 font-serif text-xl font-bold">Mot de passe</h2>
          <ChangePassword />
        </section>
      </div>
    </AdminShell>
  );
}
