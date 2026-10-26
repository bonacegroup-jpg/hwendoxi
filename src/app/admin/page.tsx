import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import {
  IconAudit, IconChanges, IconCompare, IconDeities, IconEvents, IconHome, IconReports, IconRequests, IconResources,
} from "@/components/admin/icons";
import { requireStaff, ROLE_LABEL, STATUS_LABEL, type StaffRole } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "needs_changes", "approved", "rejected", "suspended"] as const;

type Card = {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  roles: StaffRole[];
  todo?: number; // éléments à traiter (badge)
  meta?: string; // information discrète (total)
};

export default async function AdminHome() {
  const staff = await requireStaff();
  const reviewer = staff.role === "super_admin" || staff.role === "verifier";
  const editor = staff.role === "super_admin" || staff.role === "editor";
  const db = staff.supabase;

  // Statistiques par statut (réservées aux vérificateurs et au super-administrateur, comme avant)
  const counts: Record<string, number> = {};
  const head = (table: string) => db.from(table).select("id", { count: "exact", head: true });

  const [requests, changes, reports, deities, events, articles, videos] = await Promise.all([
    reviewer ? head("practitioners").in("status", ["pending", "needs_changes"]) : null,
    reviewer ? head("profile_change_requests").eq("status", "pending") : null,
    reviewer ? head("reports").eq("status", "received") : null,
    editor ? head("deities") : null,
    editor ? head("events") : null,
    editor ? head("articles") : null,
    editor ? head("videos") : null,
    ...(reviewer
      ? STATUSES.map(async (s) => {
          const { count } = await head("practitioners").eq("status", s);
          counts[s] = count ?? 0;
          return null;
        })
      : []),
  ]);

  const n = (r: { count: number | null } | null) => r?.count ?? 0;
  const plural = (v: number, one: string, many: string) => `${v} ${v > 1 ? many : one}`;

  const cards: Card[] = [
    { href: "/admin/demandes", title: "Demandes", description: "Dossiers de référencement à examiner et à valider", icon: <IconRequests />, roles: ["super_admin", "verifier"], todo: n(requests) },
    { href: "/admin/modifications", title: "Modifications", description: "Demandes de modification de profils déjà publiés", icon: <IconChanges />, roles: ["super_admin", "verifier"], todo: n(changes) },
    { href: "/admin/signalements", title: "Signalements", description: "Alertes envoyées par les visiteurs", icon: <IconReports />, roles: ["super_admin", "verifier"], todo: n(reports) },
    { href: "/admin/accueil", title: "Page d’accueil", description: "Choisir les contenus mis en avant", icon: <IconHome />, roles: ["super_admin", "editor"] },
    { href: "/admin/divinites", title: "Divinités", description: "Fiches de divinités et de traditions", icon: <IconDeities />, roles: ["super_admin", "editor"], meta: plural(n(deities), "fiche", "fiches") },
    { href: "/admin/evenements", title: "Événements", description: "Agenda des événements du secteur", icon: <IconEvents />, roles: ["super_admin", "editor"], meta: plural(n(events), "événement", "événements") },
    { href: "/admin/ressources", title: "Ressources", description: "Actualités, vidéos et émissions, documentation", icon: <IconResources />, roles: ["super_admin", "editor"], meta: plural(n(articles) + n(videos), "publication", "publications") },
    { href: "/admin/test-visage", title: "Test de comparaison", description: "Diagnostic de comparaison de visages (réservé)", icon: <IconCompare />, roles: ["super_admin"] },
    { href: "/admin/journal", title: "Journal d’audit", description: "Historique des actions de l’équipe", icon: <IconAudit />, roles: ["super_admin"] },
  ];
  const visible = cards.filter((c) => c.roles.includes(staff.role));

  return (
    <AdminShell staff={staff}>
      <h1 className="font-serif text-3xl font-bold">Tableau de bord</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Bonjour {staff.name} — {ROLE_LABEL[staff.role]}</p>

      {reviewer && (
        <section aria-labelledby="stats-title" className="mb-10">
          <h2 id="stats-title" className="mb-3 font-serif text-xl font-bold">Indicateurs</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
            {STATUSES.map((s) => (
              <Link key={s} href={`/admin/demandes?statut=${s}`} className="rounded-2xl border border-line bg-white p-5 hover:border-gold">
                <p className="font-serif text-3xl font-bold text-gold-dark">{counts[s] ?? 0}</p>
                <p className="text-sm text-muted">{STATUS_LABEL[s]}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="rubriques-title">
        <h2 id="rubriques-title" className="mb-3 font-serif text-xl font-bold">Rubriques</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => (
            <Link key={c.href} href={c.href} className="group relative flex gap-4 rounded-2xl border border-line bg-white p-5 transition hover:border-gold hover:shadow-sm focus-visible:outline-2 focus-visible:outline-gold-dark">
              <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-sand text-gold-dark group-hover:bg-gold group-hover:text-ink">{c.icon}</span>
              <span className="min-w-0">
                <span className="block font-serif text-lg font-bold leading-tight">{c.title}</span>
                <span className="mt-1 block text-sm text-muted">{c.description}</span>
                {c.meta && <span className="mt-2 block text-xs font-semibold text-gold-dark">{c.meta}</span>}
              </span>
              {c.todo !== undefined && c.todo > 0 && (
                <span className="absolute right-4 top-4 min-w-7 rounded-full bg-gold px-2 py-0.5 text-center text-sm font-bold text-ink" aria-label={`${c.todo} à traiter`}>
                  {c.todo}
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
