import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, locales, type Locale } from "@/i18n/config";

// Leitet Adressen ohne Sprachpräfix auf die passende Sprache um (Cookie → Browser-Sprache → Deutsch).
function preferredLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get("pp_locale")?.value;
  if (cookie && isLocale(cookie)) return cookie;
  const header = request.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const tag = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (isLocale(tag)) return tag;
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return;
  request.nextUrl.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // API, Next-Interna, statische Dateien und Metadaten-Routen ausnehmen
  matcher: ["/((?!api|_next|sw.js|manifest.webmanifest|robots.txt|sitemap.xml|icons|favicon.ico|.*\\.[a-z0-9]+$).*)"],
};
