import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { SITE_URL } from "@/lib/seo";
import { categories } from "@/lib/categories";

// Öffentliche, suchmaschinenrelevante Seiten in allen Sprachen mit hreflang-Varianten
const paths = ["", "/search", "/offers", "/comparisons", "/categories", ...categories.map((c) => `/category/${c.slug}`), "/scan", "/lists", "/budget", "/sources", "/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.flatMap((path) =>
    locales.map((l) => ({
      url: `${SITE_URL}/${l}${path}`,
      changeFrequency: path === "/offers" ? ("daily" as const) : ("weekly" as const),
      priority: path === "" ? 1 : 0.7,
      alternates: { languages: Object.fromEntries(locales.map((x) => [x, `${SITE_URL}/${x}${path}`])) },
    })),
  );
}
