import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { requireStaff, STATUS_LABEL } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "needs_changes", "approved", "rejected", "suspended"] as const;

export default async function AdminHome() {
  const staff = await requireStaff();
  const reviewer = staff.role === "super_admin" || staff.role === "verifier";

  const counts: Record<string, number> = {};
  if (reviewer) {
    await Promise.all(
      STATUSES.map(async (s) => {
        const { count } = await staff.supabase.from("practitioners").select("id", { count: "exact", head: true }).eq("status", s);
        counts[s] = count ?? 0;
      }),
    );
  }

  return (
    <AdminShell staff={staff}>
      <h1 className="mb-6 font-serif text-3xl font-bold">Tableau de bord</h1>
      {reviewer ? (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            {STATUSES.map((s) => (
              <Link key={s} href={`/admin/demandes?statut=${s}`} className="rounded-2xl border border-line bg-white p-5 hover:border-gold">
                <p className="font-serif text-3xl font-bold text-gold-dark">{counts[s] ?? 0}</p>
                <p className="text-sm text-muted">{STATUS_LABEL[s]}</p>
              </Link>
            ))}
          </div>
          <p className="mt-6">
            <Link href="/admin/demandes" className="font-semibold text-gold-dark underline">Examiner les demandes en cours</Link>
          </p>
        </>
      ) : (
        <p className="text-muted">La gestion des contenus (divinités, articles, vidéos, événements) arrivera dans une prochaine version.</p>
      )}
    </AdminShell>
  );
}
