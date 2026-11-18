// GOG.com: öffentliche Katalog-Schnittstelle (ohne Schlüssel) – rabattierte Spiele, Preise in Euro je Land.
import { getJson, toCents } from "../http";
import type { DealCountry, RawDeal } from "../types";
import { httpsUrl, type Connector } from "./types";

interface GogProduct {
  id: string;
  title: string;
  slug: string;
  storeLink?: string;
  coverHorizontal?: string;
  productType?: string;
  genres?: { name: string }[];
  developers?: string[];
  price?: { finalMoney?: { amount: string; currency: string }; baseMoney?: { amount: string; currency: string } };
}

// it-IT liefert bei GOG keine Treffer – für Italien englische Titel, Preise trotzdem in Euro für Italien
const LOCALE: Record<DealCountry, string> = { DE: "de-DE", IT: "en-US" };

export function mapGog(p: GogProduct, country: DealCountry, now: Date): RawDeal | null {
  const fin = p.price?.finalMoney, base = p.price?.baseMoney;
  if (!fin || fin.currency !== "EUR") return null;
  const priceCents = toCents(fin.amount);
  const baseCents = toCents(base?.amount);
  const url = httpsUrl(p.storeLink) ?? `https://www.gog.com/${country === "DE" ? "de" : "it"}/game/${p.slug}`;
  if (priceCents === null) return null;
  return {
    id: `gog:${country}:${p.id}`,
    source: "gog",
    merchant: "GOG.com",
    country,
    category: "gaming-konsolen",
    subcategory: p.genres?.[0]?.name?.slice(0, 60) ?? null,
    title: p.title.slice(0, 200),
    brand: p.developers?.[0]?.slice(0, 80) ?? null,
    gtin: null,
    image: httpsUrl(p.coverHorizontal),
    url,
    affiliate: false,
    priceCents,
    shippingCents: 0,
    delivery: "digital",
    condition: "digital",
    availability: "in_stock",
    references: baseCents && baseCents > priceCents ? [{ kind: "merchant_previous", cents: baseCents }] : [],
    coupon: null,
    validUntil: null,
    observedAt: now.toISOString(),
    note: "PC · DRM-frei (GOG)",
    sellerRating: null,
  };
}

export const gog: Connector = {
  key: "gog",
  label: "GOG.com (Spiele)",
  kind: "public",
  homepage: "https://www.gog.com",
  terms: "Öffentliche Katalogdaten des Shops, Verlinkung auf die Produktseite; abschaltbar im Admin",
  env: [],
  countries: ["DE", "IT"],
  intervalMinutes: 120,
  trusted: true,
  async fetch(country, ctx) {
    const out: RawDeal[] = [];
    for (const page of [1, 2]) {
      const q = `limit=48&order=desc:trending&discounted=eq%3Atrue&productType=in%3Agame%2Cpack&page=${page}&countryCode=${country}&locale=${LOCALE[country]}&currencyCode=EUR`;
      const json = await getJson<{ products: GogProduct[] }>(`https://catalog.gog.com/v1/catalog?${q}`);
      for (const p of json.products ?? []) {
        const d = mapGog(p, country, ctx.now);
        if (d) out.push(d);
      }
    }
    return out;
  },
};
