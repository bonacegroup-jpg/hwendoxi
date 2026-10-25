import Image from "next/image";
import NewPassword from "@/components/admin/NewPassword";

export default function NewPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <Image src="/images/logo-hwendoxi.jpg" alt="HWENDOXI" width={977} height={188} className="mb-6 h-10 w-auto" priority />
      <h1 className="mb-1 font-serif text-2xl font-bold">Nouveau mot de passe</h1>
      <p className="mb-6 text-sm text-muted">Choisissez un nouveau mot de passe long et unique, à conserver dans un gestionnaire de mots de passe.</p>
      <div className="rounded-2xl border border-line bg-white p-6">
        <NewPassword />
      </div>
    </main>
  );
}
