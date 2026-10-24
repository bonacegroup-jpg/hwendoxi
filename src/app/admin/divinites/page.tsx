import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { requireStaff } from "@/lib/admin-auth";
import { btnPrimary } from "@/lib/ui";

export const dynamic = "force-dynamic";

type L = Record<string, string>;
type Row = { id: string; name: string; status: string; tradition_id: string | null; updated_at: string };
const STATUS: Record<string, string> = { draft: "Brouillon", published: "Publié", archived: "Archivé" };

export default async function DeitiesAdminPage() {
  const staff = await requireStaff(["super_admin", "editor"]);
  const [deities, traditions] = await Promise.all([
    staff.supabase.from("deities").select("id, name, status, tradition_id, updated_at").order("name").limit(500),
    staff.supabase.from("traditions").select("id, name"),
  ]);
  const trad = new Map(((traditions.data ?? []) as { id: string; name: L }[]).map((t) => [t.id, t.name.fr ?? ""]));
  const rows = (deities.data ?? []) as Row[];

  return (
    <AdminShell staff={staff}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-bold">Divinités</h1>
        <Link href="/admin/divinites/nouvelle" className={btnPrimary}>Nouvelle fiche</Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted">Aucune fiche. Créez la première.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-line"><th className="p-3">Nom</th><th className="p-3">Tradition</th><th className="p-3">Statut</th><th className="p-3">Modifiée le</th><th className="p-3" /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="p-3 font-semibold">{r.name}</td>
                  <td className="p-3">{r.tradition_id ? (trad.get(r.tradition_id) ?? "—") : "—"}</td>
                  <td className="p-3">{STATUS[r.status] ?? r.status}</td>
                  <td className="p-3">{new Date(r.updated_at).toLocaleDateString("fr-FR")}</td>
                  <td className="p-3"><Link href={`/admin/divinites/${r.id}`} className="font-semibold text-gold-dark underline">Modifier</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
