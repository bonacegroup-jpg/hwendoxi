import AdminShell from "@/components/admin/AdminShell";
import DeityForm from "@/components/admin/DeityForm";
import { requireStaff } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function NewDeityPage() {
  const staff = await requireStaff(["super_admin", "editor"]);
  const { data } = await staff.supabase.from("traditions").select("id, name");
  const traditions = ((data ?? []) as { id: string; name: Record<string, string> }[]).map((t) => ({ id: t.id, name: t.name.fr ?? "" }));

  return (
    <AdminShell staff={staff}>
      <h1 className="mb-4 font-serif text-3xl font-bold">Nouvelle fiche de divinité</h1>
      <DeityForm traditions={traditions} canDelete={false} />
    </AdminShell>
  );
}
