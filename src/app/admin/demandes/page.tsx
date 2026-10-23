import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { requireStaff, STATUS_LABEL } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Row = { id: string; first_name: string; last_name: string; country: string; city: string; status: string; submitted_at: string };
const FILTERS = ["open", "pending", "needs_changes", "approved", "rejected", "suspended"] as const;

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const staff = await requireStaff(["super_admin", "verifier"]);
  const { statut } = await searchParams;
  const filter = (FILTERS as readonly string[]).includes(statut ?? "") ? (statut as string) : "open";

  let query = staff.supabase
    .from("practitioners")
    .select("id, first_name, last_name, country, city, status, submitted_at")
    .order("submitted_at", { ascending: false })
    .limit(100);
  query = filter === "open" ? query.in("status", ["pending", "needs_changes"]) : query.eq("status", filter);
  const { data } = await query;
  const rows = (data ?? []) as Row[];

  return (
    <AdminShell staff={staff}>
      <h1 className="mb-4 font-serif text-3xl font-bold">Demandes</h1>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {FILTERS.map((f) => (
          <Link key={f} href={`/admin/demandes?statut=${f}`}
            className={`rounded-full border px-3 py-1 ${f === filter ? "border-gold bg-gold font-semibold" : "border-line bg-white"}`}>
            {f === "open" ? "À traiter" : STATUS_LABEL[f]}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="text-muted">Aucune demande dans cette catégorie.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-line"><th className="p-3">Nom</th><th className="p-3">Lieu</th><th className="p-3">Envoyée le</th><th className="p-3">Statut</th><th className="p-3" /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="p-3 font-semibold">{r.first_name} {r.last_name}</td>
                  <td className="p-3">{r.city}, {r.country}</td>
                  <td className="p-3">{new Date(r.submitted_at).toLocaleDateString("fr-FR")}</td>
                  <td className="p-3">{STATUS_LABEL[r.status] ?? r.status}</td>
                  <td className="p-3"><Link href={`/admin/demandes/${r.id}`} className="font-semibold text-gold-dark underline">Examiner</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
