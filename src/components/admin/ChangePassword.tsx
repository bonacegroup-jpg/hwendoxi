"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { btnPrimary } from "@/lib/ui";

const field = "w-full rounded-xl border border-line bg-white px-4 py-3 text-base";

export default function ChangePassword() {
  const [supabase] = useState(() => createClient());
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOk(false);
    if (password.length < 12) return setMessage("Le mot de passe doit contenir au moins 12 caractères.");
    if (password !== confirm) return setMessage("Les deux mots de passe ne sont pas identiques.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage("Changement impossible. Reconnectez-vous puis réessayez.");
    } else {
      setMessage("Mot de passe modifié.");
      setOk(true);
      setPassword("");
      setConfirm("");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-3">
      <label htmlFor="pw" className="block text-sm font-semibold">Nouveau mot de passe (12 caractères minimum)</label>
      <input id="pw" type="password" required minLength={12} autoComplete="new-password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} />
      <label htmlFor="pw2" className="block text-sm font-semibold">Confirmer le mot de passe</label>
      <input id="pw2" type="password" required minLength={12} autoComplete="new-password" className={field} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      {message && <p role={ok ? "status" : "alert"} className="text-sm">{message}</p>}
      <button type="submit" className={btnPrimary} disabled={busy}>Changer le mot de passe</button>
    </form>
  );
}
