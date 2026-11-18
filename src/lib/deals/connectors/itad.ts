// IsThereAnyDeal API v2: Spiele-Angebote vieler autorisierter Shops in Euro. Kostenloser Schlüssel: ITAD_API_KEY.
import { getJson, toCents } from "../http";
import type { DealCountry, RawDeal } from "../types";
import { httpsUrl, type Connector } from "./types";

interface ItadEntry {
  id: string;
  title: string;
  type: string | null;
  mature?: boolean;
  assets?: { banner400?: string; banner300?: string; boxart?: string };
  deal?: {
    shop: { name: string };
    price: { amount: number; currency: string };
    regular: { amount: number };
    cut: number;
    voucher?: string | null;
    drm?: { name: string }[];
    platforms?: { name: string }[];
    timestamp?: string;
    expiry?: string | null;
    url: string;
  };
}

export function mapItad(e: ItadEntry, country: DealCountry, now: Date): RawDeal | null {
  const d = e.deal;
  if (!d || d.price.currency !== "EUR" || e.mature) return null;
  const priceCents = toCents(d.price.amount);
  const regular = toCents(d.regular.amount);
  if (priceCents === null) return null;
  const drm = d.drm?.map((x) => x.name).join(", ");
  return {
    id: `itad:${country}:${e.id}:${d.shop.name}`.slice(0, 160),
    source: "itad",
    merchant: d.shop.name.slice(0, 80),
    country,
    category: e.type === "dlc" ? "gaming-konsolen" : e.type === "game" ? "gaming-konsolen" : "digitale-produkte-software",
    subcategory: e.type === "dlc" ? "DLC" : null,
    title: e.title.slice(0, 200),
    brand: null,
    gtin: null,
    image: httpsUrl(e.assets?.banner400 ?? e.assets?.banner300 ?? e.assets?.boxart),
    url: d.url,
    affiliate: false,
    priceCents,
    shippingCents: 0,
    delivery: "digital",
    condition: "digital",
    availability: "in_stock",
    references: regular && regular > priceCents ? [{ kind: "merchant_previous", cents: regular }] : [],
    coupon: d.voucher ?? null,
    validUntil: d.expiry ?? null,
    observedAt: d.timestamp && Date.parse(d.timestamp) <= now.getTime() ? now.toISOString() : now.toISOString(),
    note: drm ? `Aktivierung: ${drm}`.slice(0, 160) : null,
    sellerRating: null,
  };
}

export const itad: Connector = {
  key: "itad",
  label: "IsThereAnyDeal (Spiele, viele Shops)",
  kind: "api",
  homepage: "https://isthereanydeal.com",
  terms: "Kostenloser API-Schlüssel, Quellenangabe „IsThereAnyDeal“",
  env: ["ITAD_API_KEY"],
  countries: ["DE", "IT"],
  intervalMinutes: 120,
  trusted: true,
  async fetch(country, ctx) {
    const json = await getJson<{ list: ItadEntry[] }>(
      `https://api.isthereanydeal.com/deals/v2?key=${encodeURIComponent(ctx.env.ITAD_API_KEY!)}&country=${country}&limit=200&sort=-trending&mature=false`,
    );
    return (json.list ?? []).map((e) => mapItad(e, country, ctx.now)).filter((d): d is RawDeal => d !== null);
  },
};
