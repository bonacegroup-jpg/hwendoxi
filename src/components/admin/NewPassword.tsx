"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { btnPrimary } from "@/lib/ui";

type Stage = "waiting" | "ready" | "invalid";
const field = "w-full rounded-xl border border-line bg-white px-4 py-3 text-base";

export default function NewPassword() {
  const [supabase] = useState(() => createClient());
  const [stage, setStage] = useState<Stage>("waiting");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Le lien de l'e-mail ouvre une session temporaire de récupération : on attend qu'elle soit établie.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setStage("ready");
    });
    const timer = setTimeout(async () => {
      const { data: s } = await supabase.auth.getSession();
      setStage(s.session ? "ready" : "invalid");
    }, 3000);
    return () => {
      data.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [supabase]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (password.length < 12) return setError("Le mot de passe doit contenir au moins 12 caractères.");
    if (password !== confirm) return setError("Les deux mots de passe ne sont pas identiques.");
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("Changement impossible. Le lien a peut-être expiré : recommencez la procédure.");
      setBusy(false);
      return;
    }
    await supabase.auth.signOut();
    window.location.href = "/admin/connexion";
  }

  if (stage === "waiting") return <p className="text-muted">Vérification du lien…</p>;
  if (stage === "invalid") {
    return <p role="alert" className="text-sm">Lien invalide ou expiré. <a href="/admin/reinitialisation" className="underline">Demander un nouveau lien</a>.</p>;
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <label htmlFor="pw" className="block text-sm font-semibold">Nouveau mot de passe (12 caractères minimum)</label>
      <input id="pw" type="password" required minLength={12} autoComplete="new-password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} />
      <label htmlFor="pw2" className="block text-sm font-semibold">Confirmer le mot de passe</label>
      <input id="pw2" type="password" required minLength={12} autoComplete="new-password" className={field} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      {error && <p role="alert" className="text-sm">{error}</p>}
      <button type="submit" className={btnPrimary} disabled={busy}>Enregistrer le mot de passe</button>
      <p className="text-xs text-muted">Vous devrez ensuite vous reconnecter avec votre code de double authentification.</p>
    </form>
  );
}
