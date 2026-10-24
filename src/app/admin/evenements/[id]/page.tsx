import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import EventForm from "@/components/admin/EventForm";
import { requireStaff } from "@/lib/admin-auth";
import { publicMediaUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

type L = Record<string, string> | null;
type Row = {
  id: string; title: L; description: L; starts_at: string; ends_at: string | null; location: string | null; organizer: string | null;
  contact: string | null; registration_url: string | null; image_path: string | null; status: string;
};

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff(["super_admin", "editor"]);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data } = await staff.supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const e = data as Row;

  return (
    <AdminShell staff={staff}>
      <h1 className="mb-4 font-serif text-3xl font-bold">Modifier : {e.title?.fr ?? "événement"}</h1>
      <EventForm
        canDelete={staff.role === "super_admin"}
        currentImageUrl={publicMediaUrl(e.image_path)}
        initial={{
          id: e.id,
          titleFr: e.title?.fr ?? "",
          titleEn: e.title?.en ?? "",
          descFr: e.description?.fr ?? "",
          descEn: e.description?.en ?? "",
          startsAt: e.starts_at.slice(0, 16),
          endsAt: e.ends_at ? e.ends_at.slice(0, 16) : "",
          location: e.location ?? "",
          organizer: e.organizer ?? "",
          contact: e.contact ?? "",
          registrationUrl: e.registration_url ?? "",
          status: e.status,
        }}
      />
    </AdminShell>
  );
}
