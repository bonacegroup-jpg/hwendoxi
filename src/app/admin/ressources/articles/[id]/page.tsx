import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import ArticleForm from "@/components/admin/ArticleForm";
import { requireStaff } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type L = Record<string, string> | null;
type Row = { id: string; kind: "documentation" | "news"; title: L; summary: L; body: L; cover_path: string | null; status: string };

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff(["super_admin", "editor"]);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await staff.supabase.from("articles").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const a = data as Row;

  return (
    <AdminShell staff={staff}>
      <h1 className="mb-4 font-serif text-3xl font-bold">Modifier : {a.title?.fr ?? "contenu"}</h1>
      <ArticleForm
        canDelete={staff.role === "super_admin"}
        initial={{
          id: a.id, kind: a.kind, titleFr: a.title?.fr ?? "", titleEn: a.title?.en ?? "",
          summaryFr: a.summary?.fr ?? "", summaryEn: a.summary?.en ?? "", bodyFr: a.body?.fr ?? "", bodyEn: a.body?.en ?? "", coverPath: a.cover_path, status: a.status,
        }}
      />
    </AdminShell>
  );
}
