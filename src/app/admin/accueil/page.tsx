import AdminShell from "@/components/admin/AdminShell";
import HomeManager, { type Item, type SectionData } from "@/components/admin/HomeManager";
import { requireStaff } from "@/lib/admin-auth";
import { getHomeSelection, type Section } from "@/lib/featured";

export const dynamic = "force-dynamic";

type L = Record<string, string> | null;

export default async function HomeAdminPage() {
  const staff = await requireStaff(["super_admin", "editor"]);
  const { config, ids } = await getHomeSelection();
  const db = staff.supabase;

  const [prac, events, news, docs, videos] = await Promise.all([
    db.from("practitioners_public").select("id, display_name, city, country").order("display_name").limit(500),
    db.from("events").select("id, title, starts_at, ends_at").eq("status", "published").order("starts_at", { ascending: false }).limit(200),
    db.from("articles").select("id, title").eq("kind", "news").eq("status", "published").order("published_at", { ascending: false }).limit(200),
    db.from("articles").select("id, title").eq("kind", "documentation").eq("status", "published").order("published_at", { ascending: false }).limit(200),
    db.from("videos").select("id, title").eq("status", "published").order("published_at", { ascending: false }).limit(200),
  ]);

  const fr = (t: L) => t?.fr ?? "(sans titre)";
  const now = Date.now();
  const candidates: Record<Section, Item[]> = {
    practitioners: ((prac.data ?? []) as { id: string; display_name: string; city: string; country: string }[]).map((p) => ({ id: p.id, label: `${p.display_name} — ${p.city}, ${p.country}` })),
    events: ((events.data ?? []) as { id: string; title: L; starts_at: string; ends_at: string | null }[]).map((e) => {
      const end = e.ends_at ? Date.parse(e.ends_at) : Date.parse(`${e.starts_at.slice(0, 10)}T23:59:59Z`);
      const date = new Date(e.starts_at).toLocaleDateString("fr-FR", { timeZone: "UTC" });
      return { id: e.id, label: `${fr(e.title)} — ${date}${end < now ? " (terminé : non affiché sur l’accueil)" : ""}` };
    }),
    news: ((news.data ?? []) as { id: string; title: L }[]).map((a) => ({ id: a.id, label: fr(a.title) })),
    videos: ((videos.data ?? []) as { id: string; title: L }[]).map((v) => ({ id: v.id, label: fr(v.title) })),
    documentation: ((docs.data ?? []) as { id: string; title: L }[]).map((a) => ({ id: a.id, label: fr(a.title) })),
  };

  const meta: { section: Section; title: string; help: string }[] = [
    { section: "practitioners", title: "Annuaire — praticiens", help: "Praticiens présentés dans la section « Annuaire » de l’accueil. Les fiches restent dans l’annuaire complet." },
    { section: "events", title: "Événements", help: "Événements présentés sur l’accueil. Les événements terminés n’y sont jamais affichés ; tous restent dans la rubrique « Événements »." },
    { section: "news", title: "Ressources — Actualités (1re position)", help: "Actualités publiées affichées en premier dans la section « Ressources »." },
    { section: "videos", title: "Ressources — Vidéos et émissions (2e position)", help: "Vidéos publiées affichées en deuxième position." },
    { section: "documentation", title: "Ressources — Documentation (3e position)", help: "Documents publiés affichés en dernière position." },
  ];

  const sections: SectionData[] = meta.map((m) => ({
    ...m,
    mode: config[m.section].mode,
    max: config[m.section].max,
    selected: ids[m.section],
    candidates: candidates[m.section],
  }));

  return (
    <AdminShell staff={staff}>
      <h1 className="mb-2 font-serif text-3xl font-bold">Page d’accueil</h1>
      <p className="mb-6 max-w-3xl text-sm text-muted">
        Choisissez ce qui est mis en avant. Retirer un élément de l’accueil ne le supprime jamais : il reste accessible dans sa rubrique.
        L’ordre des rubriques « Ressources » (Actualités, Vidéos et émissions, Documentation) est fixe. Seuls les contenus publiés peuvent être mis en avant.
      </p>
      <HomeManager sections={sections} />
    </AdminShell>
  );
}
