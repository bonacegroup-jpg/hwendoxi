import Image from "next/image";
import ResetRequest from "@/components/admin/ResetRequest";

export default function ResetPage() {
  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <Image src="/images/logo-hwendoxi.jpg" alt="HWENDOXI" width={977} height={188} className="mb-6 h-10 w-auto" priority />
      <h1 className="mb-1 font-serif text-2xl font-bold">Mot de passe oublié</h1>
      <p className="mb-6 text-sm text-muted">Saisissez l’adresse e-mail de votre compte d’administration.</p>
      <div className="rounded-2xl border border-line bg-white p-6">
        <ResetRequest />
      </div>
    </main>
  );
}
