// Open Prices (Open Food Facts): belegte Filialpreise mit vom Händler ausgewiesenem Vorpreis. ODbL, kein Schlüssel.
import { getJson, toCents } from "../http";
import type { DealCountry, RawDeal } from "../types";
import { gtinOrNull, httpsUrl, isoDay, type Connector } from "./types";

const AREA: Record<DealCountry, { lat: number; lon: number; km: number }> = {
  DE: { lat: 51.16, lon: 10.45, km: 480 },
  IT: { lat: 41.9, lon: 12.6, km: 720 },
};

interface PriceItem {
  id: number;
  product_code: string | null;
  price: number;
  price_without_discount: number | null;
  currency: string | null;
  date: string | null;
  product: { product_name?: string | null; brands?: string | null; image_url?: string | null; source?: string | null } | null;
  location: { osm_brand?: string | null; osm_name?: string | null; osm_address_city?: string | null; osm_address_country_code?: string | null } | null;
}

const CATEGORY_BY_SOURCE: Record<string, string> = { obf: "beauty-kosmetik", opff: "tierbedarf", opf: "haushalt-reinigung" };

export function mapOpenPrice(p: PriceItem, country: DealCountry): RawDeal | null {
  const loc = p.location ?? {};
  if (loc.osm_address_country_code !== country || (p.currency && p.currency !== "EUR")) return null;
  const priceCents = toCents(p.price);
  const name = p.product?.product_name?.trim();
  const merchant = (loc.osm_brand || loc.osm_name || "").trim();
  const observedAt = isoDay(p.date);
  if (priceCents === null || !name || !merchant || !observedAt) return null;
  const prev = toCents(p.price_without_discount);
  const brand = p.product?.brands?.split(",")[0]?.trim() || null;
  return {
    id: `openprices:${p.id}`,
    source: "open-prices",
    merchant,
    country,
    category: CATEGORY_BY_SOURCE[p.product?.source ?? ""] ?? "lebensmittel-getraenke",
    subcategory: null,
    title: name.slice(0, 200),
    brand: brand?.slice(0, 80) ?? null,
    gtin: gtinOrNull(p.product_code),
    image: httpsUrl(p.product?.image_url),
    url: `https://prices.openfoodfacts.org/prices/${p.id}`,
    affiliate: false,
    priceCents,
    shippingCents: null,
    delivery: "store",
    condition: "new",
    availability: "unknown",
    references: prev && prev > priceCents ? [{ kind: "merchant_previous", cents: prev }] : [],
    coupon: null,
    validUntil: null,
    observedAt,
    note: loc.osm_address_city ? `Filialpreis · ${loc.osm_address_city}`.slice(0, 160) : "Filialpreis",
    sellerRating: null,
  };
}

export const openPrices: Connector = {
  key: "open-prices",
  label: "Open Prices (Open Food Facts)",
  kind: "public",
  homepage: "https://prices.openfoodfacts.org",
  terms: "Daten unter ODbL, Belegfotos CC BY-SA 4.0 – Quellenangabe erforderlich",
  env: [],
  countries: ["DE", "IT"],
  intervalMinutes: 180,
  trusted: true,
  async fetch(country) {
    const a = AREA[country];
    const out: RawDeal[] = [];
    for (const page of [1, 2]) {
      const q = new URLSearchParams({ price_is_discounted: "true", currency: "EUR", order_by: "-date", size: "100", page: String(page), lat: String(a.lat), lon: String(a.lon), radius_km: String(a.km) });
      const json = await getJson<{ items: PriceItem[] }>(`https://prices.openfoodfacts.org/api/v1/prices?${q}`);
      for (const p of json.items ?? []) {
        const d = mapOpenPrice(p, country);
        if (d) out.push(d);
      }
    }
    return out;
  },
};
