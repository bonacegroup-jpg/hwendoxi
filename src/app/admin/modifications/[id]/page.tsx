import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import ChangeDecisionForm from "@/components/admin/ChangeDecisionForm";
import { requireStaff } from "@/lib/admin-auth";
import type { ProfilePayload } from "@/lib/profile-input";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Req = { id: string; practitioner_id: string; status: string; review_note: string | null; payload: ProfilePayload & { photoPath: string | null; photoPublic: boolean } };
type P = { spiritual_name: string | null; title: string; category_id: string | null; specialties: string[] | null; years_declared: number | null; bio: string | null; country: string; city: string; photo_public: boolean };
type Contact = { kind: string; value: string; is_public: boolean };

const SOCIAL = ["facebook", "instagram", "tiktok", "x", "website"];

export default async function ChangeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff(["super_admin", "verifier"]);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data } = await staff.supabase.from("profile_change_requests").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const req = data as Req;
  const x = req.payload;

  const [pr, contacts, cats] = await Promise.all([
    staff.supabase.from("practitioners").select("spiritual_name, title, category_id, specialties, years_declared, bio, country, city, photo_public").eq("id", req.practitioner_id).maybeSingle(),
    staff.supabase.from("practitioner_contacts").select("kind, value, is_public").eq("practitioner_id", req.practitioner_id),
    staff.supabase.from("categories").select("id, name"),
  ]);
  const p = pr.data as P | null;
  if (!p) notFound();
  const rows = (contacts.data ?? []) as Contact[];
  const cat = new Map(((cats.data ?? []) as { id: string; name: Record<string, string> }[]).map((c) => [c.id, c.name.fr ?? ""]));
  const get = (kind: string) => rows.find((c) => c.kind === kind)?.value ?? "";
  const curPub = [p.photo_public ? "photo" : "", ...rows.filter((c) => c.is_public).map((c) => (c.kind === "phone" || c.kind === "whatsapp" ? c.kind : "social"))].filter(Boolean);

  let photoUrl: string | null = null;
  if (x.photoPath) {
    const { data: s } = await createAdminClient().storage.from("private-submissions").createSignedUrl(x.photoPath, 300);
    photoUrl = s?.signedUrl ?? null;
  }

  const lines: [string, string, string][] = [
    ["Nom affiché publiquement", p.spiritual_name ?? "", x.spiritualName],
    ["Titre", p.title, x.title],
    ["Catégorie", cat.get(p.category_id ?? "") ?? "", cat.get(x.category) ?? ""],
    ["Spécialités", (p.specialties ?? []).join(", "), x.specialties.join(", ")],
    ["Années d’exercice", String(p.years_declared ?? ""), String(x.years)],
    ["Présentation", p.bio ?? "", x.bio],
    ["Pays", p.country, x.country],
    ["Ville", p.city, x.city],
    ["Téléphone", get("phone"), x.phone],
    ["WhatsApp", get("whatsapp"), x.whatsapp],
    ...SOCIAL.map((k): [string, string, string] => [k[0].toUpperCase() + k.slice(1), get(k), x.socials[k] ?? ""]),
    ["Informations publiées", [...new Set(curPub)].join(", ") || "aucune", x.pub.join(", ") || "aucune"],
  ];

  return (
    <AdminShell staff={staff}>
      <p className="mb-3 text-sm"><Link href="/admin/modifications" className="text-gold-dark underline">← Retour aux modifications</Link></p>
      <h1 className="mb-1 font-serif text-3xl font-bold">Demande de modification</h1>
      <p className="mb-6 text-sm text-muted">
        Statut : {req.status === "pending" ? "en attente" : req.status === "approved" ? "approuvée" : "refusée"} —{" "}
        <Link href={`/admin/demandes/${req.practitioner_id}`} className="text-gold-dark underline">voir le dossier du praticien</Link>
      </p>

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        <section className="overflow-x-auto rounded-2xl border border-line bg-white p-4">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-line"><th className="p-2">Champ</th><th className="p-2">Actuel</th><th className="p-2">Proposé</th></tr></thead>
            <tbody>
              {lines.map(([label, cur, next]) => {
                const changed = cur !== next;
                return (
                  <tr key={label} className={`border-b border-line align-top last:border-0 ${changed ? "bg-sand" : ""}`}>
                    <td className="p-2 font-semibold">{label}</td>
                    <td className="whitespace-pre-line p-2 text-muted">{cur || "—"}</td>
                    <td className="whitespace-pre-line p-2">{next || "—"}{changed ? " ✎" : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {photoUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="Nouvelle photo proposée" className="mt-4 max-h-56 rounded-xl border border-line" />
              <p className="mt-1 text-xs text-muted">Nouvelle photo proposée (lien valable 5 minutes).</p>
            </>
          )}
        </section>

        <aside>
          {req.status === "pending" ? <ChangeDecisionForm id={req.id} /> : <section className="rounded-2xl border border-line bg-white p-6 text-sm">Demande déjà traitée.{req.review_note ? ` Message : ${req.review_note}` : ""}</section>}
        </aside>
      </div>
    </AdminShell>
  );
}
