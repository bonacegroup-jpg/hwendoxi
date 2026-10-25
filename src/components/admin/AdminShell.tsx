import Image from "next/image";
import Link from "next/link";
import { ROLE_LABEL, type StaffRole } from "@/lib/admin-auth";
import LogoutButton from "./LogoutButton";

export default function AdminShell({
  staff,
  children,
}: {
  staff: { name: string; role: StaffRole };
  children: React.ReactNode;
}) {
  const reviewer = staff.role === "super_admin" || staff.role === "verifier";
  const editor = staff.role === "super_admin" || staff.role === "editor";
  const link = "text-[15px] hover:text-gold-dark";
  return (
    <>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-5 py-3">
          <Link href="/admin" aria-label="Tableau de bord">
            <Image src="/images/logo-hwendoxi.jpg" alt="HWENDOXI" width={977} height={188} className="h-8 w-auto" />
          </Link>
          <span className="text-sm font-semibold">Administration</span>
          <nav className="ml-4 flex flex-wrap gap-4">
            <Link href="/admin" className={link}>Tableau de bord</Link>
            {reviewer && <Link href="/admin/demandes" className={link}>Demandes</Link>}
            {reviewer && <Link href="/admin/modifications" className={link}>Modifications</Link>}
            {reviewer && <Link href="/admin/signalements" className={link}>Signalements</Link>}
            {editor && <Link href="/admin/divinites" className={link}>Divinités</Link>}
            {editor && <Link href="/admin/evenements" className={link}>Événements</Link>}
            {editor && <Link href="/admin/ressources" className={link}>Ressources</Link>}
            {staff.role === "super_admin" && <Link href="/admin/test-visage" className={link}>Test comparaison</Link>}
            {staff.role === "super_admin" && <Link href="/admin/journal" className={link}>Journal d’audit</Link>}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-muted">{staff.name} — {ROLE_LABEL[staff.role]}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </>
  );
}
