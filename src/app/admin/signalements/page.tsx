import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import ReportActions from "@/components/admin/ReportActions";
import { requireStaff } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Report = { id: string; target_type: string; target_id: string | null; message: string; reporter_email: string | null; status: string; created_at: string };
const LABEL: Record<string, string> = { received: "Reçu", in_review: "En examen", closed: "Clos" };

export default async function ReportsPage() {
  const staff = await requireStaff(["super_admin", "verifier"]);
  const { data } = await staff.supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as Report[];

  return (
    <AdminShell staff={staff}>
      <h1 className="mb-2 font-serif text-3xl font-bold">Signalements</h1>
      <p className="mb-4 text-sm text-muted">Un signalement est une alerte à examiner : il n’est jamais publié et ne constitue pas un fait établi.</p>
      {rows.length === 0 ? (
        <p className="text-muted">Aucun signalement.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-gold-dark px-2.5 py-0.5 text-xs font-semibold text-gold-dark">{LABEL[r.status] ?? r.status}</span>
                <span className="text-sm text-muted">{new Date(r.created_at).toLocaleString("fr-FR")}</span>
                {r.target_type === "practitioner" && r.target_id && (
                  <Link href={`/admin/demandes/${r.target_id}`} className="text-sm font-semibold text-gold-dark underline">Voir le profil concerné</Link>
                )}
                <span className="ml-auto"><ReportActions id={r.id} status={r.status} /></span>
              </div>
              <p className="mt-3 whitespace-pre-line">{r.message}</p>
              {r.reporter_email && <p className="mt-2 text-sm text-muted">Contact : {r.reporter_email}</p>}
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
