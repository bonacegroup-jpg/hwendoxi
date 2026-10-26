import AdminShell from "@/components/admin/AdminShell";
import ArticleForm from "@/components/admin/ArticleForm";
import { requireStaff } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function NewArticlePage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const staff = await requireStaff(["super_admin", "editor"]);
  const { type } = await searchParams;
  const kind = type === "news" ? "news" : "documentation";
  return (
    <AdminShell staff={staff}>
      <h1 className="mb-4 font-serif text-3xl font-bold">{kind === "news" ? "Nouvelle actualité" : "Nouveau document"}</h1>
      <ArticleForm canDelete={false} initial={{ kind, titleFr: "", titleEn: "", summaryFr: "", summaryEn: "", bodyFr: "", bodyEn: "", coverPath: null, status: "draft" }} />
    </AdminShell>
  );
}
