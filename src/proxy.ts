import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16 : ce fichier s’appelle proxy.ts (anciennement middleware.ts).
// Il redirige "/" vers la bonne langue (/fr ou /en).
export default createMiddleware(routing);

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
