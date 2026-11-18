// Händler- und Affiliate-Produktfeeds (Awin, Google-Merchant-Format, eigene CSV/TSV). Konfiguration nur serverseitig
// über FEEDS_JSON, weil Feed-Adressen Zugangsschlüssel enthalten:
// [{"key":"awin-otto","label":"Otto (Awin)","url":"https://…","preset":"awin","country":"DE","affiliate":true,"maxRows":3000}]
import { z } from "zod";
import { getText, toCents } from "../http";
import { classify } from "../categories";
import type { DealCountry, RawDeal, Reference } from "../types";
import { gtinOrNull, httpsUrl, type Connector } from "./types";

export const FeedConfigSchema = z.object({
  key: z.string().regex(/^[a-z0-9-]{2,30}$/),
  label: z.string().min(2).max(60),
  url: z.string().url(),
  preset: z.enum(["awin", "google"]),
  country: z.enum(["DE", "IT"]),
  merchant: z.string().max(80).optional(),
  affiliate: z.boolean().default(true),
  maxRows: z.number().int().positive().max(20000).default(3000),
});
export type FeedConfig = z.infer<typeof FeedConfigSchema>;

/** CSV/TSV-Parser mit Anführungszeichen, Trennzeichen wird erkannt. */
export function parseDelimited(text: string): Record<string, string>[] {
  const firstLine = text.slice(0, text.indexOf("\n") > 0 ? text.indexOf("\n") : text.length);
  const delim = [",", ";", "\t", "|"].reduce((best, d) => (firstLine.split(d).length > firstLine.split(best).length ? d : best), ",");
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  if (!head) return [];
  const keys = head.map((h) => h.trim().toLowerCase());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

const AVAIL = (v: string): RawDeal["availability"] => {
  const s = v.toLowerCase();
  if (["1", "yes", "true", "in stock", "in_stock", "auf lager", "disponibile"].includes(s)) return "in_stock";
  if (["0", "no", "false", "out of stock", "out_of_stock", "nicht verfügbar", "esaurito"].includes(s)) return "out_of_stock";
  if (s.includes("limited") || s.includes("begrenzt")) return "limited";
  return "unknown";
};
const COND = (v: string): RawDeal["condition"] => {
  const s = v.toLowerCase();
  if (s.includes("refurb") || s.includes("ricondiz") || s.includes("generalüber")) return "refurbished";
  if (s.includes("b-ware") || s.includes("bware") || s.includes("open box")) return "bware";
  if (s.includes("used") || s.includes("gebraucht") || s.includes("usato")) return "used";
  return "new";
};

/** Google-Merchant-Versand „DE:::4.95 EUR“ → Cent für das Land */
const googleShipping = (v: string, country: DealCountry) => {
  if (!v) return null;
  const part = v.split(",").find((p) => p.startsWith(`${country}:`)) ?? v.split(",")[0];
  return toCents(part.split(":").pop() ?? "");
};

export function mapFeedRow(r: Record<string, string>, cfg: FeedConfig, now: Date): RawDeal | null {
  const refs: Reference[] = [];
  let id: string, title: string, url: string | null, image: string | null, price: number | null, shipping: number | null;
  let merchant = cfg.merchant ?? "", brand: string | null, gtin: string | null, avail: RawDeal["availability"], cond: RawDeal["condition"], cat: string, until: string | null = null;
  if (cfg.preset === "awin") {
    id = r.aw_product_id || r.merchant_product_id;
    title = r.product_name;
    url = httpsUrl(r.aw_deep_link || r.merchant_deep_link);
    image = httpsUrl(r.merchant_image_url || r.aw_image_url || r.large_image);
    price = toCents(r.search_price || r.store_price || r.display_price);
    shipping = r.delivery_cost === "" || r.delivery_cost === undefined ? null : toCents(r.delivery_cost);
    merchant ||= r.merchant_name;
    brand = r.brand_name || null;
    gtin = gtinOrNull(r.ean || r.product_gtin || r.upc);
    avail = AVAIL(r.in_stock ?? r.stock_status ?? "");
    cond = COND(r.condition ?? "");
    cat = classify(r.merchant_category, r.category_name, title);
    const rrp = toCents(r.rrp_price), old = toCents(r.product_price_old);
    if (old && price && old > price) refs.push({ kind: "merchant_previous", cents: old });
    if (rrp && price && rrp > price) refs.push({ kind: "rrp", cents: rrp });
    until = r.valid_to ? new Date(r.valid_to).toISOString() : null;
  } else {
    id = r.id;
    title = r.title;
    url = httpsUrl(r.link);
    image = httpsUrl(r.image_link);
    const regular = toCents(r.price), sale = toCents(r.sale_price);
    price = sale ?? regular;
    if (sale !== null && regular !== null && regular > sale) refs.push({ kind: "merchant_previous", cents: regular });
    shipping = googleShipping(r.shipping ?? "", cfg.country);
    brand = r.brand || null;
    gtin = gtinOrNull(r.gtin);
    avail = AVAIL(r.availability ?? "");
    cond = COND(r.condition ?? "");
    cat = classify(r.product_type, r.google_product_category, title);
  }
  if (!id || !title || !url || price === null || !merchant) return null;
  return {
    id: `feed:${cfg.key}:${id}`.slice(0, 160),
    source: `feed:${cfg.key}`,
    merchant: merchant.slice(0, 80),
    country: cfg.country,
    category: cat,
    subcategory: null,
    title: title.slice(0, 200),
    brand: brand?.slice(0, 80) ?? null,
    gtin,
    image,
    url,
    affiliate: cfg.affiliate,
    priceCents: price,
    shippingCents: shipping,
    delivery: "online",
    condition: cond,
    availability: avail,
    references: refs,
    coupon: null,
    validUntil: until && !Number.isNaN(Date.parse(until)) ? until : null,
    observedAt: now.toISOString(),
    note: null,
    sellerRating: null,
  };
}

export function feedConfigs(env: Record<string, string | undefined>): FeedConfig[] {
  if (!env.FEEDS_JSON) return [];
  try {
    return z.array(FeedConfigSchema).parse(JSON.parse(env.FEEDS_JSON));
  } catch {
    return [];
  }
}

export function feedConnector(cfg: FeedConfig): Connector {
  return {
    key: `feed:${cfg.key}`,
    label: cfg.label,
    kind: "feed",
    homepage: new URL(cfg.url).origin,
    terms: cfg.affiliate ? "Partner-/Affiliate-Feed – Links werden als Anzeige gekennzeichnet" : "Händler-Produktfeed",
    env: ["FEEDS_JSON"],
    countries: [cfg.country],
    intervalMinutes: 360,
    trusted: true,
    async fetch(country, ctx) {
      if (country !== cfg.country) return [];
      const rows = parseDelimited(await getText(cfg.url, {}, 20000));
      const deals = rows.map((r) => mapFeedRow(r, cfg, ctx.now)).filter((d): d is RawDeal => d !== null);
      // Angebote mit Bezugspreis zuerst, dann nach Rabatt; begrenzt auf maxRows
      return deals
        .sort((a, b) => (b.references[0] ? 1 - a.priceCents / b.references[0].cents : 0) - (a.references[0] ? 1 - b.priceCents / a.references[0].cents : 0))
        .slice(0, cfg.maxRows);
    },
  };
}
