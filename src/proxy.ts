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

/** Admin-Bereich: HTTP-Basic-Anmeldung „admin“ + ADMIN_TOKEN (nur als Server-Umgebungsvariable gesetzt). */
function adminGate(request: NextRequest): NextResponse | null {
  if (!/^\/(de|it|en)\/admin(\/|$)/.test(request.nextUrl.pathname)) return null;
  const token = process.env.ADMIN_TOKEN;
  if (!token || token.length < 16) return new NextResponse("Admin-Bereich ist nicht eingerichtet (ADMIN_TOKEN fehlt).", { status: 503 });
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Basic ${btoa(`admin:${token}`)}`;
  if (auth.length === expected.length && auth === expected) return null;
  return new NextResponse("Anmeldung erforderlich", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Preis-Pilot Admin", charset="UTF-8"', "Cache-Control": "no-store" } });
}

export function proxy(request: NextRequest) {
  const gate = adminGate(request);
  if (gate) return gate;
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
