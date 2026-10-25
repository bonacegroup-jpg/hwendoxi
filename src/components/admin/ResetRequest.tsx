"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { btnPrimary } from "@/lib/ui";

export default function ResetRequest() {
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/admin/nouveau-mot-de-passe` });
    // Même réponse que le compte existe ou non : on ne révèle pas quelles adresses sont enregistrées.
    setSent(true);
    setBusy(false);
  }

  if (sent) {
    return <p role="status" className="text-sm">Si un compte existe pour cette adresse, un e-mail contenant un lien de réinitialisation vient d’être envoyé. Le lien est valable un temps limité.</p>;
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <label htmlFor="email" className="block text-sm font-semibold">Adresse e-mail du compte</label>
      <input id="email" type="email" required autoComplete="username" className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="submit" className={btnPrimary} disabled={busy}>Envoyer le lien</button>
    </form>
  );
}
