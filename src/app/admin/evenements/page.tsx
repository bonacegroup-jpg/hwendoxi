import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { requireStaff } from "@/lib/admin-auth";
import { btnPrimary } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Row = { id: string; title: Record<string, string>; starts_at: string; status: string; location: string | null };
const STATUS: Record<string, string> = { draft: "Brouillon", published: "Publié", archived: "Archivé" };

export default async function EventsAdminPage() {
  const staff = await requireStaff(["super_admin", "editor"]);
  const { data } = await staff.supabase.from("events").select("id, title, starts_at, status, location").order("starts_at", { ascending: false }).limit(300);
  const rows = (data ?? []) as Row[];

  return (
    <AdminShell staff={staff}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-bold">Événements</h1>
        <Link href="/admin/evenements/nouveau" className={btnPrimary}>Nouvel événement</Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted">Aucun événement. Créez le premier.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-line"><th className="p-3">Titre</th><th className="p-3">Date</th><th className="p-3">Lieu</th><th className="p-3">Statut</th><th className="p-3" /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="p-3 font-semibold">{r.title?.fr ?? "—"}</td>
                  <td className="p-3">{new Date(r.starts_at).toLocaleString("fr-FR", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="p-3">{r.location ?? "—"}</td>
                  <td className="p-3">{STATUS[r.status] ?? r.status}</td>
                  <td className="p-3"><Link href={`/admin/evenements/${r.id}`} className="font-semibold text-gold-dark underline">Modifier</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
