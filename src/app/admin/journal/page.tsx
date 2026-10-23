import AdminShell from "@/components/admin/AdminShell";
import { requireStaff } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Log = { id: number; at: string; actor_role: string | null; action: string; target_type: string | null; target_id: string | null; details: Record<string, unknown> | null };

export default async function AuditPage() {
  const staff = await requireStaff(["super_admin"]);
  const { data } = await staff.supabase.from("audit_logs").select("*").order("at", { ascending: false }).limit(100);
  const rows = (data ?? []) as Log[];

  return (
    <AdminShell staff={staff}>
      <h1 className="mb-4 font-serif text-3xl font-bold">Journal d’audit</h1>
      {rows.length === 0 ? (
        <p className="text-muted">Aucune action enregistrée.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-line"><th className="p-3">Date</th><th className="p-3">Rôle</th><th className="p-3">Action</th><th className="p-3">Cible</th><th className="p-3">Détails</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line align-top last:border-0">
                  <td className="p-3">{new Date(r.at).toLocaleString("fr-FR")}</td>
                  <td className="p-3">{r.actor_role ?? "—"}</td>
                  <td className="p-3">{r.action}</td>
                  <td className="p-3">{r.target_type ?? "—"} {r.target_id ? r.target_id.slice(0, 8) : ""}</td>
                  <td className="p-3">{r.details ? JSON.stringify(r.details) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
