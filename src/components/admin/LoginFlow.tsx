"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { btnPrimary } from "@/lib/ui";

type Stage = "loading" | "credentials" | "enroll" | "verify";
const field = "w-full rounded-xl border border-line bg-white px-4 py-3 text-base";

export default function LoginFlow() {
  const [supabase] = useState(() => createClient());
  const [stage, setStage] = useState<Stage>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Après le mot de passe : vérifier le code (si déjà configuré) ou configurer la double authentification
  async function proceed() {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === "aal2") {
      window.location.href = "/admin";
      return;
    }
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totp = factors?.totp?.[0];
    if (totp) {
      setFactorId(totp.id);
      setStage("verify");
      return;
    }
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `HWENDOXI-${Date.now()}`,
    });
    if (enrollError || !data) {
      setError("Impossible de préparer la double authentification. Vérifiez qu’elle est activée dans Supabase (Authentication, Multi-Factor).");
      setStage("credentials");
      return;
    }
    setFactorId(data.id);
    setQr(data.totp.qr_code);
    setSecret(data.totp.secret);
    setStage("enroll");
  }

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) await proceed();
      else setStage("credentials");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      setError("Identifiants incorrects.");
      setBusy(false);
      return;
    }
    await proceed();
    setBusy(false);
  }

  async function verify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) {
      setError("Vérification impossible pour le moment. Réessayez.");
      setBusy(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: code.trim() });
    if (verifyError) {
      setError("Code incorrect ou expiré.");
      setBusy(false);
      return;
    }
    window.location.href = "/admin";
  }

  async function cancel() {
    await supabase.auth.signOut();
    setStage("credentials");
    setCode("");
    setError("");
  }

  if (stage === "loading") return <p className="text-muted">Chargement…</p>;

  if (stage === "credentials") {
    return (
      <form onSubmit={signIn} className="space-y-3">
        <label htmlFor="email" className="block text-sm font-semibold">Adresse e-mail</label>
        <input id="email" type="email" required autoComplete="username" className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="password" className="block text-sm font-semibold">Mot de passe</label>
        <input id="password" type="password" required autoComplete="current-password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p role="alert" className="text-sm">{error}</p>}
        <button type="submit" className={btnPrimary} disabled={busy}>Continuer</button>
        <p className="text-sm"><a href="/admin/reinitialisation" className="underline">Mot de passe oublié ?</a></p>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="space-y-3">
      {stage === "enroll" && (
        <div className="space-y-3 text-sm">
          <p className="font-semibold">Première connexion : activez la double authentification.</p>
          <p>1. Installez une application d’authentification (Google Authenticator, Microsoft Authenticator, Authy…).<br />2. Scannez ce code avec l’application.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Code QR à scanner" className="size-48 rounded-xl border border-line bg-white p-2" />
          <p>Si vous ne pouvez pas scanner, saisissez cette clé dans l’application : <code className="break-all rounded bg-sand px-1">{secret}</code><br />Conservez-la dans un endroit sûr : elle permet de reconfigurer l’application en cas de perte du téléphone.</p>
          <p>3. Saisissez le code à 6 chiffres affiché par l’application.</p>
        </div>
      )}
      {stage === "verify" && <p className="text-sm font-semibold">Saisissez le code à 6 chiffres de votre application d’authentification.</p>}
      <label htmlFor="code" className="sr-only">Code à 6 chiffres</label>
      <input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required className={field} value={code} onChange={(e) => setCode(e.target.value)} />
      {error && <p role="alert" className="text-sm">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" className={btnPrimary} disabled={busy}>Valider</button>
        <button type="button" className="text-sm underline" onClick={cancel}>Annuler</button>
      </div>
    </form>
  );
}
