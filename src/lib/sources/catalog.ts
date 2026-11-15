import "server-only";
import { cacheLife } from "next/cache";
import { z } from "zod";
import { countries, type Country } from "@/i18n/config";
import { isValidGtin } from "../barcode";
import type { Category } from "../categories";
import { assessObservations } from "../price-quality";
import { toQuantity } from "../units";
import { fetchJson } from "./http";
import { mapPricesPage } from "./prices-map";
import type { Product } from "./types";

// Produkte aus Open Prices (inkl. Schwesterdatenbanken) und echte Ketten-Vergleiche.
const BASE = "https://prices.openfoodfacts.org/api/v1";
const SEARCH = "https://search.openfoodfacts.org/search";

const OpProduct = z
  .object({
    code: z.string(),
    source: z.string().nullish(),
    product_name: z.string().nullish(),
    brands: z.string().nullish(),
    image_url: z.string().nullish(),
    product_quantity: z.number().nullish(),
    product_quantity_unit: z.string().nullish(),
    quantity: z.string().nullish(),
    categories_tags: z.array(z.string()).nullish(),
    nutriscore_grade: z.string().nullish(),
    price_count: z.number().nullish(),
  })
  .passthrough();
type OpProduct = z.infer<typeof OpProduct>;

const SOURCE_SITE: Record<string, string> = {
  off: "https://world.openfoodfacts.org",
  obf: "https://world.openbeautyfacts.org",
  opff: "https://world.openpetfoodfacts.org",
  opf: "https://world.openproductsfacts.org",
};

export interface CatalogItem {
  code: string;
  name: string;
  brand: string | null;
  quantityText: string | null;
  imageUrl: string | null;
  priceCount: number;
}

function cleanImage(url: string | null | undefined): string | null {
  return url && url.startsWith("https://images.openfoodfacts.org/") ? url : null;
}

function toItem(p: OpProduct): CatalogItem | null {
  if (!p.product_name?.trim() || !isValidGtin(p.code)) return null;
  return {
    code: p.code,
    name: p.product_name.trim(),
    brand: p.brands?.split(",")[0]?.trim() || null,
    quantityText: p.quantity?.replace(/\.0 /, " ") || null,
    imageUrl: cleanImage(p.image_url),
    priceCount: p.price_count ?? 0,
  };
}

/** Produkte einer Kategorie mit mindestens einem dokumentierten Preis (meiste Preise zuerst). */
export async function getCategoryProducts(filter: Category["filter"], page: number): Promise<{ items: CatalogItem[]; total: number }> {
  "use cache";
  cacheLife("hours");
  const params = new URLSearchParams({ order_by: "-price_count", price_count__gte: "1", size: "24", page: String(page) });
  if (filter.source) params.set("source", filter.source);
  if (filter.categoriesTag) params.set("categories_tags__contains", filter.categoriesTag);
  const json = z.object({ items: z.array(OpProduct), total: z.number().optional() }).safeParse(await fetchJson("Open Prices", `${BASE}/products?${params}`));
  if (!json.success) return { items: [], total: 0 };
  return { items: json.data.items.map(toItem).filter((x): x is CatalogItem => x !== null), total: json.data.total ?? 0 };
}

/** Ersatzquelle für Produkte, die nicht in Open Food Facts stehen (Drogerie, Haushalt, Tierbedarf). */
export async function getOpenPricesProduct(code: string): Promise<Product | null> {
  "use cache";
  cacheLife("hours");
  const json = await fetchJson("Open Prices", `${BASE}/products/code/${encodeURIComponent(code)}`, { allow404: true });
  const parsed = OpProduct.safeParse(json);
  if (!parsed.success || !parsed.data.product_name) return null;
  const p = parsed.data;
  const qty = p.product_quantity && p.product_quantity_unit ? toQuantity(p.product_quantity, p.product_quantity_unit) : null;
  const site = SOURCE_SITE[p.source ?? "off"] ?? SOURCE_SITE.off;
  return {
    code: p.code,
    name: p.product_name?.trim() ?? null,
    brand: p.brands?.split(",")[0]?.trim() || null,
    quantityText: p.quantity?.replace(/\.0 /, " ") || null,
    packageBase: qty?.base ?? null,
    packageDimension: qty?.dimension ?? null,
    imageUrl: cleanImage(p.image_url),
    categories: p.categories_tags ?? [],
    nutriscore: p.nutriscore_grade && /^[a-e]$/.test(p.nutriscore_grade) ? p.nutriscore_grade : null,
    source: "open_food_facts",
    sourceUrl: `${site}/product/${p.code}`,
  };
}

export interface Comparison {
  code: string;
  name: string;
  quantityText: string | null;
  imageUrl: string | null;
  /** je Kette der jüngste geprüfte Preis, günstigster zuerst */
  offers: { chain: string; priceCents: number; date: string; dataType: string }[];
  /** Abstand günstigster zu teuerstem belegten Preis in Prozent */
  spreadPercent: number;
}

/**
 * Echte Ketten-Vergleiche: beliebte Produkte des Landes, für die in mindestens zwei Ketten
 * geprüfte Preise aus den letzten 365 Tagen vorliegen. Nichts wird ergänzt oder geschätzt.
 */
export async function getComparisons(country: Country, limit = 12): Promise<Comparison[]> {
  "use cache";
  cacheLife("hours");
  const tag = countries[country].offTag;
  const codes: string[] = [];
  for (const page of [1, 2]) {
    const q = new URLSearchParams({ q: `countries_tags:"${tag}"`, sort_by: "-unique_scans_n", page_size: "100", page: String(page), fields: "code" });
    const json = (await fetchJson("Open Food Facts Suche", `${SEARCH}?${q}`)) as { hits?: { code?: string }[] };
    for (const h of json.hits ?? []) if (h.code && isValidGtin(h.code)) codes.push(h.code);
  }
  // Nur Produkte mit mindestens zwei dokumentierten Preisen weiter prüfen
  const meta = new Map<string, OpProduct>();
  for (let i = 0; i < codes.length; i += 50) {
    const json = z.object({ items: z.array(OpProduct) }).safeParse(
      await fetchJson("Open Prices", `${BASE}/products?size=50&code__in=${codes.slice(i, i + 50).join(",")}`),
    );
    if (json.success) for (const p of json.data.items) if ((p.price_count ?? 0) >= 2) meta.set(p.code, p);
  }
  const since = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);
  const candidates = [...meta.keys()];
  const all = [];
  for (let i = 0; i < candidates.length; i += 25) {
    const params = new URLSearchParams({ product_code__in: candidates.slice(i, i + 25).join(","), currency: "EUR", date__gte: since, order_by: "-date", size: "100" });
    for (let page = 1; page <= 2; page++) {
      params.set("page", String(page));
      const { items, total } = mapPricesPage(await fetchJson("Open Prices", `${BASE}/prices?${params}`));
      all.push(...items.filter((o) => o.store.countryCode === country));
      if (page * 100 >= total) break;
    }
  }
  const quality = assessObservations(all);
  const byProduct = new Map<string, Map<string, (typeof all)[number]>>();
  for (const o of all) {
    if (!o.productCode || o.pricePer !== "item" || !quality.get(o.id)?.usable) continue;
    const chain = (o.store.chain ?? o.store.name).trim();
    const key = chain.toLowerCase();
    const m = byProduct.get(o.productCode) ?? new Map();
    const prev = m.get(key);
    if (!prev || o.date > prev.date) m.set(key, o);
    byProduct.set(o.productCode, m);
  }
  const result: Comparison[] = [];
  for (const [code, chains] of byProduct) {
    if (chains.size < 2) continue;
    const p = meta.get(code);
    const offers = [...chains.values()]
      .sort((a, b) => a.priceCents - b.priceCents)
      .map((o) => ({ chain: (o.store.chain ?? o.store.name).trim(), priceCents: o.priceCents, date: o.date, dataType: o.dataType }));
    const max = offers[offers.length - 1].priceCents;
    result.push({
      code,
      name: p?.product_name?.trim() || code,
      quantityText: p?.quantity?.replace(/\.0 /, " ") || null,
      imageUrl: cleanImage(p?.image_url),
      offers,
      spreadPercent: max > 0 ? Math.round(((max - offers[0].priceCents) / max) * 100) : 0,
    });
  }
  // Mehr Ketten und größere belegte Unterschiede zuerst
  return result.sort((a, b) => b.offers.length - a.offers.length || b.spreadPercent - a.spreadPercent).slice(0, limit);
}
