"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Barre supérieure volontairement réduite : Tableau de bord et Profil (la déconnexion est à côté).
export default function AdminNav() {
  const pathname = usePathname();
  const item = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-[15px] ${active ? "bg-gold font-semibold text-ink" : "hover:text-gold-dark"}`;

  return (
    <nav className="flex items-center gap-1" aria-label="Navigation de l’administration">
      <Link href="/admin" className={item(pathname === "/admin")} aria-current={pathname === "/admin" ? "page" : undefined}>Tableau de bord</Link>
      <Link href="/admin/profil" className={item(pathname.startsWith("/admin/profil"))} aria-current={pathname.startsWith("/admin/profil") ? "page" : undefined}>Profil</Link>
    </nav>
  );
}
