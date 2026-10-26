import Image from "next/image";
import Link from "next/link";
import type { StaffRole } from "@/lib/admin-auth";
import AdminNav from "./AdminNav";
import LogoutButton from "./LogoutButton";

// Cadre commun de l'administration : barre supérieure limitée à Tableau de bord, Profil et Déconnexion.
// Toutes les autres rubriques sont accessibles depuis les cartes du tableau de bord.
export default function AdminShell({
  children,
}: {
  staff: { name: string; role: StaffRole };
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-5 py-3">
          <Link href="/admin" aria-label="Tableau de bord">
            <Image src="/images/logo-hwendoxi.jpg" alt="HWENDOXI" width={977} height={188} className="h-8 w-auto" />
          </Link>
          <span className="hidden text-sm font-semibold sm:inline">Administration</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <AdminNav />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </>
  );
}
