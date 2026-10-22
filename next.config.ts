import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Active la gestion des langues (next-intl). Le fichier de configuration est src/i18n/request.ts
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
