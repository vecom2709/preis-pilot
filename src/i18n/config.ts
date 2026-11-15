export const locales = ["de", "it", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "de";

export function isLocale(v: string): v is Locale {
  return (locales as readonly string[]).includes(v);
}

/** BCP-47-Tag für Zahlen- und Datumsformatierung */
export const intlLocale: Record<Locale, string> = { de: "de-DE", it: "it-IT", en: "en-GB" };

export const countries = {
  DE: { code: "DE", currency: "EUR", center: { lat: 51.16, lon: 10.45 }, radiusKm: 480, offTag: "en:germany" },
  IT: { code: "IT", currency: "EUR", center: { lat: 41.9, lon: 12.6 }, radiusKm: 720, offTag: "en:italy" },
} as const;
export type Country = keyof typeof countries;
export const countryCodes = Object.keys(countries) as Country[];

export function isCountry(v: string | null | undefined): v is Country {
  return !!v && v in countries;
}

export const defaultCountryFor: Record<Locale, Country> = { de: "DE", it: "IT", en: "DE" };
