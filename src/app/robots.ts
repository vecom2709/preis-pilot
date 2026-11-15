import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  if (process.env.PREISPILOT_NOINDEX === "1") return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/*/account", "/*/insights", "/*/radar"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
