import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/*/account", "/*/insights", "/*/radar"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
