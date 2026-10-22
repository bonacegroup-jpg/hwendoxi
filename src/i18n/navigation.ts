import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Versions des composants de navigation qui gèrent automatiquement la langue dans l’URL.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
