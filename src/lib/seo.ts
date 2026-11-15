import type { Metadata } from "next";
import { locales, type Locale } from "@/i18n/config";

// Netlify setzt URL automatisch auf die Adresse des Projekts
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.URL ?? "http://localhost:3000";

const ogLocale: Record<Locale, string> = { de: "de_DE", it: "it_IT", en: "en_GB" };

/** Metadaten mit kanonischer Adresse und hreflang-Varianten für alle Sprachen */
export function pageMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}${path}`]));
  return {
    title,
    description,
    alternates: { canonical: `/${locale}${path}`, languages: { ...languages, "x-default": `/de${path}` } },
    openGraph: { title, description, locale: ogLocale[locale], type: "website", siteName: "Preis-Pilot", url: `/${locale}${path}` },
  };
}
