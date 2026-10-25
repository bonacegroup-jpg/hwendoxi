import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { requireStaff } from "@/lib/admin-auth";
import { btnGhost, btnPrimary } from "@/lib/ui";

export const dynamic = "force-dynamic";

type L = Record<string, string> | null;
type Article = { id: string; kind: string; title: L; status: string; updated_at: string };
type Video = { id: string; youtube_id: string; title: L; status: string; updated_at: string };
const STATUS: Record<string, string> = { draft: "Brouillon", published: "Publié", archived: "Archivé" };

// Ordre des rubriques : Actualités, Vidéos et émissions, Documentation.
export default async function ResourcesAdminPage() {
  const staff = await requireStaff(["super_admin", "editor"]);
  const [articles, videos] = await Promise.all([
    staff.supabase.from("articles").select("id, kind, title, status, updated_at").order("updated_at", { ascending: false }).limit(200),
    staff.supabase.from("videos").select("id, youtube_id, title, status, updated_at").order("updated_at", { ascending: false }).limit(200),
  ]);
  const arts = (articles.data ?? []) as Article[];
  const news = arts.filter((a) => a.kind === "news");
  const docs = arts.filter((a) => a.kind === "documentation");
  const vids = (videos.data ?? []) as Video[];

  const table = (rows: Article[], empty: string) =>
    rows.length === 0 ? (
      <p className="text-muted">{empty}</p>
    ) : (
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="p-3 font-semibold">{r.title?.fr ?? "—"}</td>
                <td className="p-3">{STATUS[r.status] ?? r.status}</td>
                <td className="p-3">{new Date(r.updated_at).toLocaleDateString("fr-FR")}</td>
                <td className="p-3"><Link href={`/admin/ressources/articles/${r.id}`} className="font-semibold text-gold-dark underline">Modifier</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  return (
    <AdminShell staff={staff}>
      <h1 className="mb-2 font-serif text-3xl font-bold">Ressources</h1>
      <p className="mb-6 text-sm text-muted">
        Pour choisir ce qui apparaît sur la page d’accueil : <Link href="/admin/accueil" className="font-semibold text-gold-dark underline">gérer la page d’accueil</Link>.
      </p>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl font-bold">Actualités</h2>
        <Link href="/admin/ressources/articles/nouveau?type=news" className={btnPrimary}>Nouvelle actualité</Link>
      </div>
      {table(news, "Aucune actualité.")}

      <div className="mb-3 mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl font-bold">Vidéos et émissions</h2>
        <Link href="/admin/ressources/videos/nouvelle" className={btnPrimary}>Nouvelle vidéo</Link>
      </div>
      {vids.length === 0 ? (
        <p className="text-muted">Aucune vidéo.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <tbody>
              {vids.map((v) => (
                <tr key={v.id} className="border-b border-line last:border-0">
                  <td className="p-3 font-semibold">{v.title?.fr ?? "—"}</td>
                  <td className="p-3">{STATUS[v.status] ?? v.status}</td>
                  <td className="p-3">{new Date(v.updated_at).toLocaleDateString("fr-FR")}</td>
                  <td className="p-3"><Link href={`/admin/ressources/videos/${v.id}`} className={`${btnGhost} !px-3 !py-1 text-sm`}>Modifier</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mb-3 mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl font-bold">Documentation</h2>
        <Link href="/admin/ressources/articles/nouveau?type=documentation" className={btnPrimary}>Nouveau document</Link>
      </div>
      {table(docs, "Aucun document.")}
    </AdminShell>
  );
}
