// eBay Browse API (offizielle, kostenlose Entwicklerschnittstelle). Zugangsdaten: EBAY_CLIENT_ID, EBAY_CLIENT_SECRET,
// optional EBAY_CAMPAIGN_ID (eBay Partner Network → Links werden als Anzeige gekennzeichnet).
import { getJson, toCents } from "../http";
import { classify } from "../categories";
import type { DealCountry, RawDeal } from "../types";
import { httpsUrl, type Connector, type ConnectorContext } from "./types";

const MARKET: Record<DealCountry, string> = { DE: "EBAY_DE", IT: "EBAY_IT" };
/** Suchbegriffe je Kategorie für die Angebotssuche (Neuware mit ausgewiesenem Vorpreis) */
const DEAL_QUERIES: Record<DealCountry, string[]> = {
  DE: ["Fernseher", "Smartphone", "Notebook", "Kopfhörer", "Kaffeevollautomat", "Waschmaschine", "Akkuschrauber", "Sommerreifen", "Saugroboter", "Spielkonsole", "Smartwatch", "Rasenmäher"],
  IT: ["televisore", "smartphone", "notebook", "cuffie", "macchina caffè", "lavatrice", "trapano avvitatore", "pneumatici", "robot aspirapolvere", "console", "smartwatch", "tosaerba"],
};

let token: { value: string; until: number } | null = null;

async function accessToken(ctx: ConnectorContext): Promise<string> {
  if (token && token.until > Date.now() + 60_000) return token.value;
  const basic = Buffer.from(`${ctx.env.EBAY_CLIENT_ID}:${ctx.env.EBAY_CLIENT_SECRET}`).toString("base64");
  const res = await getJson<{ access_token: string; expires_in: number }>("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });
  token = { value: res.access_token, until: Date.now() + res.expires_in * 1000 };
  return token.value;
}

interface EbayItem {
  itemId: string;
  title: string;
  image?: { imageUrl?: string };
  price?: { value: string; currency: string };
  marketingPrice?: { originalPrice?: { value: string }; priceTreatment?: string };
  shippingOptions?: { shippingCost?: { value: string; currency: string }; shippingCostType?: string }[];
  condition?: string;
  conditionId?: string;
  seller?: { username?: string; feedbackPercentage?: string };
  itemWebUrl?: string;
  itemAffiliateWebUrl?: string;
  itemEndDate?: string;
  categories?: { categoryName?: string }[];
}

const CONDITION: Record<string, RawDeal["condition"]> = { "1000": "new", "1500": "new", "2000": "refurbished", "2500": "refurbished", "2750": "refurbished", "3000": "used", "7000": "used" };

export function mapEbay(i: EbayItem, country: DealCountry, now: Date, affiliate: boolean): RawDeal | null {
  if (!i.price || i.price.currency !== "EUR") return null;
  const priceCents = toCents(i.price.value);
  const url = httpsUrl(affiliate ? i.itemAffiliateWebUrl : i.itemWebUrl) ?? httpsUrl(i.itemWebUrl);
  if (priceCents === null || !url) return null;
  const ship = i.shippingOptions?.[0];
  const shippingCents = ship?.shippingCostType === "CALCULATED" || !ship?.shippingCost ? null : toCents(ship.shippingCost.value);
  const orig = toCents(i.marketingPrice?.originalPrice?.value);
  const kind = i.marketingPrice?.priceTreatment === "LIST_PRICE" ? "rrp" : "merchant_previous";
  const rating = i.seller?.feedbackPercentage ? Number(i.seller.feedbackPercentage) : null;
  return {
    id: `ebay:${country}:${i.itemId}`.slice(0, 160),
    source: "ebay",
    merchant: `eBay · ${i.seller?.username ?? "Händler"}`.slice(0, 80),
    country,
    category: classify(i.categories?.map((c) => c.categoryName).join(" "), i.title),
    subcategory: i.categories?.[0]?.categoryName?.slice(0, 60) ?? null,
    title: i.title.slice(0, 200),
    brand: null,
    gtin: null,
    image: httpsUrl(i.image?.imageUrl),
    url,
    affiliate: affiliate && !!i.itemAffiliateWebUrl,
    priceCents,
    shippingCents,
    delivery: "online",
    condition: CONDITION[i.conditionId ?? ""] ?? "used",
    availability: "in_stock",
    references: orig && orig > priceCents ? [{ kind, cents: orig }] : [],
    coupon: null,
    validUntil: i.itemEndDate ?? null,
    observedAt: now.toISOString(),
    note: i.condition ? i.condition.slice(0, 160) : null,
    sellerRating: rating !== null && Number.isFinite(rating) ? rating : null,
  };
}

async function browse(q: string, country: DealCountry, ctx: ConnectorContext, limit: number): Promise<RawDeal[]> {
  const params = new URLSearchParams({ q, limit: String(limit), filter: `buyingOptions:{FIXED_PRICE},deliveryCountry:${country},priceCurrency:EUR` });
  const json = await getJson<{ itemSummaries?: EbayItem[] }>(`https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`, {
    headers: {
      Authorization: `Bearer ${await accessToken(ctx)}`,
      "X-EBAY-C-MARKETPLACE-ID": MARKET[country],
      ...(ctx.env.EBAY_CAMPAIGN_ID ? { "X-EBAY-C-ENDUSERCTX": `affiliateCampaignId=${ctx.env.EBAY_CAMPAIGN_ID}` } : {}),
    },
  });
  return (json.itemSummaries ?? []).map((i) => mapEbay(i, country, ctx.now, !!ctx.env.EBAY_CAMPAIGN_ID)).filter((d): d is RawDeal => d !== null);
}

export const ebay: Connector = {
  key: "ebay",
  label: "eBay (Browse API)",
  kind: "api",
  homepage: "https://developer.ebay.com",
  terms: "Kostenloses Entwicklerkonto; optional eBay Partner Network für gekennzeichnete Partnerlinks",
  env: ["EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET"],
  countries: ["DE", "IT"],
  intervalMinutes: 240,
  trusted: false,
  async fetch(country, ctx) {
    const all = await Promise.all(DEAL_QUERIES[country].map((q) => browse(q, country, ctx, 50).catch(() => [] as RawDeal[])));
    // Nur Neuware mit ausgewiesenem Vorpreis und guter Händlerbewertung als „Angebot“
    return all.flat().filter((d) => d.references.length > 0 && d.condition === "new" && (d.sellerRating ?? 0) >= 97);
  },
  search: (q, country, ctx) => browse(q, country, ctx, 50),
};
