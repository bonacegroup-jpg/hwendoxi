import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DeityForm from "@/components/admin/DeityForm";
import { requireStaff } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Row = {
  id: string; name: string; other_names: string[] | null; region: string | null; tradition_id: string | null;
  description: Record<string, string> | null; sources: { title: string; url: string | null }[] | null; status: string; image_path: string | null;
};

export default async function EditDeityPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff(["super_admin", "editor"]);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [deity, traditions] = await Promise.all([
    staff.supabase.from("deities").select("*").eq("id", id).maybeSingle(),
    staff.supabase.from("traditions").select("id, name"),
  ]);
  if (!deity.data) notFound();
  const d = deity.data as Row;
  const options = ((traditions.data ?? []) as { id: string; name: Record<string, string> }[]).map((t) => ({ id: t.id, name: t.name.fr ?? "" }));

  return (
    <AdminShell staff={staff}>
      <h1 className="mb-4 font-serif text-3xl font-bold">Modifier : {d.name}</h1>
      <DeityForm
        traditions={options}
        canDelete={staff.role === "super_admin"}
        initial={{
          id: d.id,
          name: d.name,
          otherNames: (d.other_names ?? []).join(", "),
          region: d.region ?? "",
          traditionId: d.tradition_id ?? "",
          descFr: d.description?.fr ?? "",
          descEn: d.description?.en ?? "",
          sources: (d.sources ?? []).map((s) => (s.url ? `${s.title} | ${s.url}` : s.title)).join("\n"),
          status: d.status,
          imagePath: d.image_path,
        }}
      />
    </AdminShell>
  );
}
