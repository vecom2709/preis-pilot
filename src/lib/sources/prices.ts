import "server-only";
import { cacheLife } from "next/cache";
import { countries, type Country } from "@/i18n/config";
import { fetchJson } from "./http";
import { mapPricesPage } from "./prices-map";
import type { PriceObservation } from "./types";

// Open Prices (Open Food Facts): dokumentierte Preise mit Händlerstandort und Preisnachweis. Lizenz: ODbL.
const BASE = "https://prices.openfoodfacts.org/api/v1";

const inCountry = (country: Country) => (o: PriceObservation) => o.store.countryCode === country;

/** Alle dokumentierten EUR-Preise eines Produkts im gewählten Land (jüngste zuerst). */
export async function getProductPrices(code: string, country: Country): Promise<PriceObservation[]> {
  "use cache";
  cacheLife("minutes");
  const params = new URLSearchParams({ product_code: code, currency: "EUR", order_by: "-date", size: "100" });
  const { items } = mapPricesPage(await fetchJson("Open Prices", `${BASE}/prices?${params}`));
  return items.filter(inCountry(country));
}

/** Preise mehrerer Produkte auf einmal – Grundlage für Supermarkt-Vergleich und Smart Basket. */
export async function getPricesForCodes(codes: string[], country: Country): Promise<PriceObservation[]> {
  "use cache";
  cacheLife("minutes");
  const unique = [...new Set(codes)].slice(0, 40);
  if (!unique.length) return [];
  const params = new URLSearchParams({ product_code__in: unique.join(","), currency: "EUR", order_by: "-date", size: "100" });
  const results: PriceObservation[] = [];
  for (let page = 1; page <= 3; page++) {
    params.set("page", String(page));
    const { items, total } = mapPricesPage(await fetchJson("Open Prices", `${BASE}/prices?${params}`));
    results.push(...items);
    if (page * 100 >= total) break;
  }
  return results.filter(inCountry(country));
}

/** Dokumentierte reduzierte Preise im Land (ohne Laufzeitangabe – siehe offerStatus). */
export async function getDiscountedPrices(country: Country): Promise<PriceObservation[]> {
  "use cache";
  cacheLife("minutes");
  const c = countries[country];
  const params = new URLSearchParams({
    price_is_discounted: "true",
    currency: "EUR",
    order_by: "-date",
    size: "100",
    lat: String(c.center.lat),
    lon: String(c.center.lon),
    radius_km: String(c.radiusKm),
  });
  const { items } = mapPricesPage(await fetchJson("Open Prices", `${BASE}/prices?${params}`));
  return items.filter(inCountry(country));
}

export interface CountryCoverage {
  country: Country;
  locations: number;
  prices: number;
}

/** Wie viele Geschäfte und Preise sind je Land dokumentiert? (für transparente Datenlage) */
export async function getCoverage(): Promise<CountryCoverage[]> {
  "use cache";
  cacheLife("hours");
  const json = await fetchJson("Open Prices", `${BASE}/locations/osm/countries?size=300`);
  const list = Array.isArray(json) ? json : [];
  return (Object.keys(countries) as Country[]).map((country) => {
    const row = list.find((r: { country_code_2?: string }) => r?.country_code_2 === country) as
      | { location_count?: number; price_count?: number }
      | undefined;
    return { country, locations: row?.location_count ?? 0, prices: row?.price_count ?? 0 };
  });
}

/** Anzahl dokumentierter Preise je Barcode (für Suchtreffer). */
export async function getPriceCounts(codes: string[]): Promise<Record<string, number>> {
  "use cache";
  cacheLife("hours");
  const unique = [...new Set(codes)].slice(0, 50);
  if (!unique.length) return {};
  const params = new URLSearchParams({ code__in: unique.join(","), size: "50" });
  const json = (await fetchJson("Open Prices", `${BASE}/products?${params}`)) as { items?: { code?: string; price_count?: number }[] };
  return Object.fromEntries((json.items ?? []).filter((i) => i.code).map((i) => [i.code!, i.price_count ?? 0]));
}
