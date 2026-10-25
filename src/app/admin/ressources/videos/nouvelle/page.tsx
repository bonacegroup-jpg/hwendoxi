import AdminShell from "@/components/admin/AdminShell";
import VideoForm from "@/components/admin/VideoForm";
import { requireStaff } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function NewVideoPage() {
  const staff = await requireStaff(["super_admin", "editor"]);
  return (
    <AdminShell staff={staff}>
      <h1 className="mb-4 font-serif text-3xl font-bold">Nouvelle vidéo</h1>
      <VideoForm canDelete={false} initial={{ youtubeUrl: "", titleFr: "", titleEn: "", descFr: "", descEn: "", status: "draft" }} />
    </AdminShell>
  );
}
