import "server-only";
import { cacheLife } from "next/cache";
import { fetchJson } from "./http";
import { mapOffProduct, mapSearchResponse, PRODUCT_FIELDS, SEARCH_FIELDS } from "./off-map";
import type { Product, SearchHit } from "./types";
import { getOpenPricesProduct } from "./catalog";

// Produktdaten: Open Food Facts API v3 (aktuell empfohlene Version).
// Volltextsuche: Search-a-licious (von Open Food Facts empfohlen; die v2-Suche ist auf 10 Anfragen/Minute begrenzt).
const OFF_BASE = "https://world.openfoodfacts.org/api/v3/product";
const SEARCH_BASE = "https://search.openfoodfacts.org/search";

export async function getProduct(code: string, lang: string): Promise<Product | null> {
  "use cache";
  cacheLife("hours");
  const json = await fetchJson("Open Food Facts", `${OFF_BASE}/${encodeURIComponent(code)}?fields=${PRODUCT_FIELDS}&lc=${lang}`, { allow404: true });
  // Drogerie-, Haushalts- und Tierprodukte stehen nicht in Open Food Facts – dann über Open Prices
  return mapOffProduct(json, lang) ?? (await getOpenPricesProduct(code));
}

export async function searchProducts(
  query: string,
  lang: string,
  page = 1,
  countryTag?: string,
): Promise<{ hits: SearchHit[]; total: number }> {
  "use cache";
  cacheLife("hours");
  const q = countryTag ? `${query} AND countries_tags:"${countryTag}"` : query;
  const params = new URLSearchParams({ q, langs: lang, page_size: "24", page: String(page), fields: SEARCH_FIELDS });
  const json = await fetchJson("Open Food Facts Suche", `${SEARCH_BASE}?${params}`);
  return mapSearchResponse(json, lang);
}
