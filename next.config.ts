import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  // Kamera nur für die eigene Seite (Scanner), alles andere aus
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

// Vorschau-Umgebungen (z. B. Netlify) werden für Suchmaschinen gesperrt
const noindex = process.env.PREISPILOT_NOINDEX === "1";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Auf Netlify übernimmt deren Next.js-Laufzeit die Auslieferung; lokal/Docker eigenständiger Server
  output: process.env.NETLIFY ? undefined : "standalone",
  images: {
    // Produktbilder werden über den eigenen Server ausgeliefert – die IP der Nutzer geht nicht an Dritte.
    remotePatterns: [{ protocol: "https", hostname: "images.openfoodfacts.org", pathname: "/images/products/**" }],
  },
  async headers() {
    return [
      { source: "/:path*", headers: noindex ? [...securityHeaders, { key: "X-Robots-Tag", value: "noindex, nofollow" }] : securityHeaders },
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }, { key: "Service-Worker-Allowed", value: "/" }] },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
