// Preis-Pilot 3.0: Angebots-Engine
import { describe, expect, it } from "vitest";
import { scoreDeal, pickBasis, totalCents } from "@/lib/deals/score";
import { lowest30, mergeDeals, scoreAll, updateHistory } from "@/lib/deals/pipeline";
import { mapFeedRow, parseDelimited, FeedConfigSchema } from "@/lib/deals/connectors/feed";
import { mapOpenPrice } from "@/lib/deals/connectors/open-prices";
import { mapGog } from "@/lib/deals/connectors/gog";
import { mapSteam } from "@/lib/deals/connectors/steam";
import { mapEbay } from "@/lib/deals/connectors/ebay";
import { runUpdate } from "@/lib/deals/runner";
import { classify, dealCategories } from "@/lib/deals/categories";
import type { DealStore } from "@/lib/deals/store";
import type { Connector } from "@/lib/deals/connectors/types";
import type { Deal, RawDeal } from "@/lib/deals/types";

const NOW = new Date("2026-11-18T10:00:00Z");
const raw = (over: Partial<RawDeal> = {}): RawDeal => ({
  id: "x:1", source: "test", merchant: "Shop A", country: "DE", category: "tv-audio-heimkino", subcategory: null, title: "TV 65", brand: "Marke",
  gtin: "4006381333931", image: null, url: "https://shop.example/p/1", affiliate: false, priceCents: 49900, shippingCents: 0, delivery: "online",
  condition: "new", availability: "in_stock", references: [], coupon: null, validUntil: null, observedAt: NOW.toISOString(), note: null, sellerRating: null, ...over,
});
const deal = (over: Partial<Deal> = {}): Deal => ({ ...raw(over), firstSeen: NOW.toISOString(), ...over });
const memStore = (): DealStore & { data: Map<string, unknown> } => {
  const data = new Map<string, unknown>();
  return { kind: "file", data, get: async <T,>(k: string) => (data.get(k) as T) ?? null, set: async (k, v) => void data.set(k, structuredClone(v)) };
};

describe("Gesamtpreis und Bezugspreis", () => {
  it("rechnet Versand ein und lässt unbekannten Versand offen", () => {
    expect(totalCents(raw({ priceCents: 1000, shippingCents: 495 }))).toBe(1495);
    expect(totalCents(raw({ shippingCents: null }))).toBeNull();
    expect(totalCents(raw({ delivery: "store", shippingCents: null, priceCents: 199 }))).toBe(199);
  });
  it("wählt die belastbarste höhere Bezugsgröße, UVP zuletzt; ohne höhere Bezugsgröße kein Rabatt", () => {
    expect(pickBasis({ priceCents: 800, references: [{ kind: "rrp", cents: 1500 }, { kind: "merchant_previous", cents: 1000 }] })?.kind).toBe("merchant_previous");
    expect(pickBasis({ priceCents: 800, references: [{ kind: "merchant_previous", cents: 700 }] })).toBeNull();
  });
});

describe("Deal-Score", () => {
  it("ist 0–100, begründet jede Punktzahl und erfindet keinen Verlauf", () => {
    const s = scoreDeal(deal({ references: [{ kind: "merchant_previous", cents: 99900 }] }), { now: NOW, cheapestOther: null, history: [], trustedSource: true });
    expect(s.score).toBeGreaterThan(0);
    expect(s.score).toBeLessThanOrEqual(100);
    expect(s.discountPercent).toBe(50);
    expect(s.reasons.map((r) => r.code)).toContain("no_history");
    expect(s.reasons.map((r) => r.code)).toContain("discount_merchant_previous");
  });
  it("bestraft, wenn ein anderer Händler günstiger ist, und markiert Preisfehler-Verdacht", () => {
    const a = scoreDeal(deal({ references: [{ kind: "merchant_previous", cents: 200000 }] }), { now: NOW, cheapestOther: { merchant: "B", totalCents: 40000 }, history: [], trustedSource: false });
    expect(a.cheaperElsewhere?.merchant).toBe("B");
    expect(a.reasons.find((r) => r.code === "price_error_suspect")).toBeTruthy();
  });
  it("Nicht lieferbar und veraltet senken den Score deutlich", () => {
    const good = scoreDeal(deal(), { now: NOW, cheapestOther: null, history: [], trustedSource: true }).score;
    const bad = scoreDeal(deal({ availability: "out_of_stock", observedAt: "2026-11-01T00:00:00Z" }), { now: NOW, cheapestOther: null, history: [], trustedSource: true }).score;
    expect(bad).toBeLessThan(good - 30);
  });
});

describe("Zusammenführen, Ablauf und Dubletten", () => {
  it("entfernt nicht mehr gelieferte Angebote abgefragter Quellen, behält andere, entfernt abgelaufene und veraltete", () => {
    const prev = [deal({ id: "test:a" }), deal({ id: "other:b", source: "other", gtin: null }), deal({ id: "other:c", source: "other", validUntil: "2026-11-17T00:00:00Z" }), deal({ id: "other:d", source: "other", observedAt: "2026-11-01T00:00:00Z" })];
    const r = mergeDeals(prev, [raw({ id: "test:new" })], new Set(["test:DE"]), NOW);
    expect(r.deals.map((d) => d.id).sort()).toEqual(["other:b", "test:new"]);
    expect(r.added).toBe(1);
    expect(r.removed).toBe(3);
  });
  it("führt gleichen Händler + GTIN + Zustand zusammen und behält firstSeen", () => {
    const prev = [deal({ id: "test:a", firstSeen: "2026-11-10T00:00:00Z" })];
    const r = mergeDeals(prev, [raw({ id: "test:a" }), raw({ id: "feed:z", source: "feed", observedAt: "2026-11-18T09:00:00Z" })], new Set(["test:DE"]), NOW);
    expect(r.deals).toHaveLength(1);
    expect(r.deals[0].firstSeen).toBe("2026-11-10T00:00:00Z");
  });
  it("sperrt deaktivierte Händler", () => {
    expect(mergeDeals([], [raw()], new Set(["test:DE"]), NOW, ["shop a"]).deals).toHaveLength(0);
  });
});

describe("Preisverlauf und Vergleich identischer Produkte", () => {
  it("speichert Tagestiefstpreise, Referenz 30 Tage nur bei ausreichender Abdeckung", () => {
    let h = {};
    for (let i = 25; i >= 1; i--) h = updateHistory(h, [deal({ observedAt: new Date(NOW.getTime() - i * 86_400_000).toISOString(), priceCents: 52000 + i })], NOW);
    expect(lowest30((h as Record<string, [string, number][]>)["x:1"], NOW.toISOString())).toBe(52001);
    expect(lowest30([["2026-11-15", 100]], NOW.toISOString())).toBeNull();
  });
  it("vergleicht nur gleiche GTIN und gleichen Zustand, bildet Marktpreis aus mind. zwei anderen Händlern", () => {
    const ds = [deal({ id: "a", merchant: "A", priceCents: 50000 }), deal({ id: "b", merchant: "B", priceCents: 47000 }), deal({ id: "c", merchant: "C", priceCents: 55000, shippingCents: 500 }), deal({ id: "d", merchant: "D", priceCents: 20000, condition: "used" })];
    const s = scoreAll(ds, {}, NOW, new Set());
    const a = s.find((x) => x.id === "a")!;
    expect(a.cheaperElsewhere).toEqual({ merchant: "B", totalCents: 47000 });
    expect(a.references.find((r) => r.kind === "market")?.cents).toBe(51250);
    expect(s.find((x) => x.id === "d")!.cheaperElsewhere).toBeNull();
  });
});

describe("Connectoren: Abbildung echter Antworten", () => {
  it("Open Prices: Filialpreis mit Vorpreis, nur im Land", () => {
    const p = { id: 7, product_code: "4008400401621", price: 1.29, price_without_discount: 1.79, currency: "EUR", date: "2026-11-15", product: { product_name: "Milch", brands: "Weihenstephan", image_url: "https://images.openfoodfacts.org/x.jpg", source: "off" }, location: { osm_brand: "Lidl", osm_address_city: "Berlin", osm_address_country_code: "DE" } };
    const d = mapOpenPrice(p, "DE")!;
    expect(d.references).toEqual([{ kind: "merchant_previous", cents: 179 }]);
    expect(d.delivery).toBe("store");
    expect(mapOpenPrice(p, "IT")).toBeNull();
  });
  it("GOG und Steam: Euro-Preise, digital, Aktionsende", () => {
    expect(mapGog({ id: "1", title: "Spiel", slug: "spiel", price: { finalMoney: { amount: "3.75", currency: "EUR" }, baseMoney: { amount: "14.99", currency: "EUR" } } }, "DE", NOW)!.priceCents).toBe(375);
    const s = mapSteam({ id: 2, name: "Bodycam", discounted: true, discount_percent: 20, original_price: 3332, final_price: 2665, currency: "EUR", discount_expiration: 1795208400 }, "IT", NOW)!;
    expect(s.references[0].cents).toBe(3332);
    expect(s.validUntil).toBe(new Date(1795208400000).toISOString());
  });
  it("eBay: Versand berechnet = unbekannt, Partnerlink gekennzeichnet, Listenpreis = UVP", () => {
    const d = mapEbay({ itemId: "v1|1|0", title: "Samsung TV 65 Zoll", price: { value: "599.00", currency: "EUR" }, marketingPrice: { originalPrice: { value: "899.00" }, priceTreatment: "LIST_PRICE" }, shippingOptions: [{ shippingCostType: "CALCULATED" }], conditionId: "1000", itemWebUrl: "https://www.ebay.de/itm/1", itemAffiliateWebUrl: "https://www.ebay.de/itm/1?campid=5", seller: { username: "shop", feedbackPercentage: "99.2" } }, "DE", NOW, true)!;
    expect(d.shippingCents).toBeNull();
    expect(d.affiliate).toBe(true);
    expect(d.references[0].kind).toBe("rrp");
    expect(d.category).toBe("tv-audio-heimkino");
  });
  it("Feeds: CSV mit Anführungszeichen, Awin- und Google-Format", () => {
    const rows = parseDelimited('aw_product_id,product_name,aw_deep_link,search_price,rrp_price,delivery_cost,merchant_name,ean,in_stock,merchant_category\n1,"Kaffeevollautomat ""Pro""",https://x.example/1,399.00,599.00,0,Otto,4006381333931,1,Küche\n');
    const cfg = FeedConfigSchema.parse({ key: "awin-otto", label: "Otto", url: "https://x.example/feed.csv", preset: "awin", country: "DE" });
    const d = mapFeedRow(rows[0], cfg, NOW)!;
    expect(d.title).toBe('Kaffeevollautomat "Pro"');
    expect(d.references).toEqual([{ kind: "rrp", cents: 59900 }]);
    expect(d.category).toBe("kuechengeraete");
    expect(d.affiliate).toBe(true);
    const g = parseDelimited("id\ttitle\tlink\tprice\tsale_price\tshipping\tavailability\n9\tAkkuschrauber\thttps://y.example/9\t129.00 EUR\t99.00 EUR\tDE:::4.95 EUR\tin stock\n");
    const gd = mapFeedRow(g[0], FeedConfigSchema.parse({ key: "gg", label: "GG", url: "https://y.example/f.tsv", preset: "google", country: "DE", merchant: "Baumarkt Y" }), NOW)!;
    expect([gd.priceCents, gd.shippingCents, gd.references[0].cents, gd.category]).toEqual([9900, 495, 12900, "werkzeuge-maschinen"]);
  });
  it("Kategorien: 32 Bereiche, automatische Zuordnung, Unbekanntes landet bei „Weitere“", () => {
    expect(dealCategories).toHaveLength(32);
    expect(classify("Sommerreifen 205/55 R16")).toBe("auto-teile-reifen");
    expect(classify("Xyz 123")).toBe("sonstiges");
  });
});

describe("Aktualisierungslauf", () => {
  const ok = (key: string, deals: RawDeal[]): Connector => ({ key, label: key, kind: "public", homepage: "https://x", terms: "", env: [], countries: ["DE"], intervalMinutes: 60, trusted: true, fetch: async () => deals });
  it("läuft weiter, wenn eine Quelle ausfällt, protokolliert Fehler und Wiederholungen, verwirft fehlerhafte Daten", async () => {
    const store = memStore();
    const broken: Connector = { ...ok("kaputt", []), fetch: async () => { throw new Error("HTTP 503"); } };
    const log = await runUpdate({ trigger: "test", store, now: NOW, env: {}, connectors: [ok("gut", [raw({ id: "gut:1", source: "gut" }), { ...raw({ id: "gut:2", source: "gut" }), url: "keine-url" }]), broken] });
    const gut = log.sources.find((s) => s.source === "gut")!;
    const kaputt = log.sources.find((s) => s.source === "kaputt")!;
    expect([gut.ok, gut.fetched, gut.rejected]).toEqual([true, 1, 1]);
    expect([kaputt.ok, kaputt.attempts, kaputt.error]).toEqual([false, 3, "HTTP 503"]);
    expect(((await store.get<unknown[]>("deals-DE")) ?? []).length).toBe(1);
    expect(((await store.get<unknown[]>("runs")) ?? []).length).toBe(1);
  });
  it("fragt Quellen erst nach ihrem Intervall erneut ab", async () => {
    const store = memStore();
    let calls = 0;
    const c = { ...ok("takt", []), fetch: async () => { calls++; return []; } };
    await runUpdate({ trigger: "test", store, now: NOW, env: {}, connectors: [c] });
    await runUpdate({ trigger: "test", store, now: new Date(NOW.getTime() + 10 * 60_000), env: {}, connectors: [c] });
    await runUpdate({ trigger: "test", store, now: new Date(NOW.getTime() + 61 * 60_000), env: {}, connectors: [c] });
    expect(calls).toBe(2);
  });
});
