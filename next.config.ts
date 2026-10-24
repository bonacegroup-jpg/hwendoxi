import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Active la gestion des langues (next-intl). Le fichier de configuration est src/i18n/request.ts
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Autorise l'affichage (et la mise à l'échelle automatique) des photos publiées sur Supabase Storage.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/public-media/**" }]
      : [],
  },
};

export default withNextIntl(nextConfig);
