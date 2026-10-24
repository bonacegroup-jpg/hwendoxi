import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { requireStaff } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Row = { id: string; practitioner_id: string; status: string; created_at: string; payload: { spiritualName?: string } };
const STATUS: Record<string, string> = { pending: "En attente", approved: "Approuvée", rejected: "Refusée" };

export default async function ChangesPage() {
  const staff = await requireStaff(["super_admin", "verifier"]);
  const { data } = await staff.supabase.from("profile_change_requests").select("id, practitioner_id, status, created_at, payload").order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as Row[];

  return (
    <AdminShell staff={staff}>
      <h1 className="mb-2 font-serif text-3xl font-bold">Demandes de modification de profil</h1>
      <p className="mb-4 text-sm text-muted">Modifications demandées par des praticiens déjà publiés. Le profil affiché ne change qu’après votre approbation.</p>
      {rows.length === 0 ? (
        <p className="text-muted">Aucune demande de modification.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-line"><th className="p-3">Nom proposé</th><th className="p-3">Reçue le</th><th className="p-3">Statut</th><th className="p-3" /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="p-3 font-semibold">{r.payload?.spiritualName ?? "—"}</td>
                  <td className="p-3">{new Date(r.created_at).toLocaleString("fr-FR")}</td>
                  <td className="p-3">{STATUS[r.status] ?? r.status}</td>
                  <td className="p-3"><Link href={`/admin/modifications/${r.id}`} className="font-semibold text-gold-dark underline">Examiner</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
