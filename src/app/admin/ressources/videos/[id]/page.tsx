import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import VideoForm from "@/components/admin/VideoForm";
import { requireStaff } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type L = Record<string, string> | null;
type Row = { id: string; youtube_id: string; title: L; description: L; status: string };

export default async function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff(["super_admin", "editor"]);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await staff.supabase.from("videos").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const v = data as Row;

  return (
    <AdminShell staff={staff}>
      <h1 className="mb-4 font-serif text-3xl font-bold">Modifier : {v.title?.fr ?? "vidéo"}</h1>
      <VideoForm
        canDelete={staff.role === "super_admin"}
        initial={{
          id: v.id, youtubeUrl: `https://www.youtube.com/watch?v=${v.youtube_id}`, titleFr: v.title?.fr ?? "", titleEn: v.title?.en ?? "",
          descFr: v.description?.fr ?? "", descEn: v.description?.en ?? "", status: v.status,
        }}
      />
    </AdminShell>
  );
}
