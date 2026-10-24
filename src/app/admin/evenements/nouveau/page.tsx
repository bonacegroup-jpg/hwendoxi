import AdminShell from "@/components/admin/AdminShell";
import EventForm from "@/components/admin/EventForm";
import { requireStaff } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const staff = await requireStaff(["super_admin", "editor"]);
  return (
    <AdminShell staff={staff}>
      <h1 className="mb-4 font-serif text-3xl font-bold">Nouvel événement</h1>
      <EventForm canDelete={false} />
    </AdminShell>
  );
}
