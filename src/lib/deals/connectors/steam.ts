// Steam: öffentliche Storefront-Daten („Specials“) ohne Schlüssel – Preise in Euro je Land, Aktionsende bekannt.
import { getJson } from "../http";
import type { DealCountry, RawDeal } from "../types";
import { httpsUrl, type Connector } from "./types";

interface SteamItem {
  id: number;
  name: string;
  discounted: boolean;
  discount_percent: number;
  original_price: number | null;
  final_price: number;
  currency: string;
  large_capsule_image?: string;
  header_image?: string;
  discount_expiration?: number;
  windows_available?: boolean;
  mac_available?: boolean;
  linux_available?: boolean;
}

export function mapSteam(s: SteamItem, country: DealCountry, now: Date): RawDeal | null {
  if (!s.discounted || s.currency !== "EUR" || !Number.isInteger(s.final_price)) return null;
  const platforms = [s.windows_available && "Windows", s.mac_available && "macOS", s.linux_available && "Linux"].filter(Boolean).join(", ");
  return {
    id: `steam:${country}:${s.id}`,
    source: "steam",
    merchant: "Steam",
    country,
    category: "gaming-konsolen",
    subcategory: null,
    title: s.name.slice(0, 200),
    brand: null,
    gtin: null,
    image: httpsUrl(s.header_image) ?? httpsUrl(s.large_capsule_image),
    url: `https://store.steampowered.com/app/${s.id}/`,
    affiliate: false,
    priceCents: s.final_price,
    shippingCents: 0,
    delivery: "digital",
    condition: "digital",
    availability: "in_stock",
    references: s.original_price && s.original_price > s.final_price ? [{ kind: "merchant_previous", cents: s.original_price }] : [],
    coupon: null,
    validUntil: s.discount_expiration ? new Date(s.discount_expiration * 1000).toISOString() : null,
    observedAt: now.toISOString(),
    note: platforms ? `Steam-Schlüssel · ${platforms}`.slice(0, 160) : "Steam",
    sellerRating: null,
  };
}

export const steam: Connector = {
  key: "steam",
  label: "Steam (Spiele-Aktionen)",
  kind: "public",
  homepage: "https://store.steampowered.com",
  terms: "Öffentliche Storefront-Daten, Verlinkung auf die Produktseite; abschaltbar im Admin",
  env: [],
  countries: ["DE", "IT"],
  intervalMinutes: 120,
  trusted: true,
  async fetch(country, ctx) {
    const json = await getJson<{ specials?: { items: SteamItem[] }; top_sellers?: { items: SteamItem[] } }>(
      `https://store.steampowered.com/api/featuredcategories?cc=${country.toLowerCase()}&l=${country === "DE" ? "german" : "italian"}`,
    );
    const items = [...(json.specials?.items ?? []), ...(json.top_sellers?.items ?? [])];
    return items.map((s) => mapSteam(s, country, ctx.now)).filter((d): d is RawDeal => d !== null);
  },
};
