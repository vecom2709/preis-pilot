// Preis-Pilot 2.0 – Logiktests mit konstruierten Testobjekten (keine echten Marktpreise).
import { describe, expect, it } from "vitest";
import {
  advise, bestOffers, compareProducts, dailyLows, findDuplicate, forecastHints, historyGaps, normalizeModel,
  referencePrice30, sameVariant, sparGuard, watchMatches, windowStats, type MediaProduct, type Offer,
} from "@/lib/media/engine";
import { monthlyCents, nextPayment, savingsCheck, subscriptionTotals, termInfo, yearlyCents, type Subscription } from "@/lib/subscriptions";
import { checkPlan, goalProjection } from "@/lib/household";
import { computeListTotals } from "@/lib/list-totals";

const now = new Date("2026-11-15T12:00:00Z");
const tv = (id: string, specs: MediaProduct["specs"], model = id): MediaProduct => ({
  id, category: "tv-heimkino", schema: "tv", brand: "Testmarke", name: `TV ${id}`, model, specs, specSource: null, imageUrl: null, wishlist: false, createdAt: "2026-01-01",
});
let n = 0;
const offer = (p: Partial<Offer> & { productId: string; priceCents: number }): Offer => ({
  id: `o${++n}`, merchant: "Händler A", url: null, shippingCents: 0, condition: "new", availability: "in_stock", warrantyMonths: 24,
  observedAt: "2026-11-15T08:00:00Z", source: "manual", promo: null, merchantImprint: true, ...p,
});

describe("Varianten (Test 3 + 17)", () => {
  it("trennt Modellnummern, Speichergrößen und Bildgrößen", () => {
    expect(normalizeModel("OLED65-C3 6LA")).toBe("OLED65C36LA");
    const a = tv("a", { screenInches: 65 }, "OLED65C36LA");
    expect(sameVariant(a, tv("b", { screenInches: 65 }, "oled65-c3 6la"))).toBe(true);
    expect(sameVariant(a, tv("c", { screenInches: 55 }, "OLED65C36LA"))).toBe(false);
    expect(sameVariant(a, tv("d", { screenInches: 65 }, "OLED65C46LA"))).toBe(false);
    expect(findDuplicate(tv("e", { screenInches: 65 }, "OLED65C36LA"), [a])?.id).toBe("a");
  });
});

describe("Best-Price-Engine (Test 6 + 7)", () => {
  it("sortiert nach Gesamtpreis inkl. Versand und trennt Zustände", () => {
    const g = bestOffers([
      offer({ productId: "x", merchant: "A", priceCents: 69900, shippingCents: 0 }),
      offer({ productId: "x", merchant: "B", priceCents: 68900, shippingCents: 1990 }),
      offer({ productId: "x", merchant: "C", priceCents: 49900, condition: "used" }),
      offer({ productId: "x", merchant: "D", priceCents: 60000, shippingCents: null }),
    ], now);
    expect(g.get("new")!.map((o) => o.merchant)).toEqual(["A", "B", "D"]);
    expect(g.get("new")![1].totalCents).toBe(70890);
    expect(g.get("new")![2].totalCents).toBeNull();
    expect(g.get("used")!.map((o) => o.merchant)).toEqual(["C"]);
  });
  it("nennt nur frische Angebote „aktuell“ und nimmt je Händler die jüngste Beobachtung", () => {
    const g = bestOffers([
      offer({ productId: "x", merchant: "A", priceCents: 1000, observedAt: "2026-11-10T08:00:00Z" }),
      offer({ productId: "x", merchant: "A", priceCents: 900, observedAt: "2026-11-15T07:00:00Z" }),
    ], now);
    expect(g.get("new")!.length).toBe(1);
    expect(g.get("new")![0].priceCents).toBe(900);
    expect(g.get("new")![0].fresh).toBe(true);
    expect(bestOffers([offer({ productId: "x", priceCents: 1, observedAt: "2026-11-10T08:00:00Z" })], now).get("new")![0].fresh).toBe(false);
  });
});

describe("Preisverlauf, 30-Tage-Referenz, Prognose (Test 13 + 14)", () => {
  const hist = ["2026-08-20", "2026-09-05", "2026-09-20", "2026-10-01", "2026-10-15", "2026-11-01", "2026-11-14"]
    .map((d, i) => offer({ productId: "x", priceCents: [79900, 74900, 77900, 72900, 75900, 76900, 72900][i], observedAt: `${d}T10:00:00Z` }));
  const points = dailyLows(hist, "new");
  it("zeigt nur echte Beobachtungen und Lücken", () => {
    expect(points.length).toBe(7);
    expect(historyGaps(points).length).toBeGreaterThan(0);
  });
  it("wertet Zeiträume nur mit ausreichender Datenbasis aus", () => {
    expect(windowStats(points, 90, now).enough).toBe(true);
    expect(windowStats(points, 90, now).lowCents).toBe(72900);
    expect(windowStats(points.slice(-2), 30, now).enough).toBe(false);
  });
  it("kennzeichnet Prognosen als Einordnung und fehlende Daten", () => {
    expect(forecastHints(points, 72900, now)).toContainEqual({ kind: "near_low", lowCents: 72900 });
    expect(forecastHints(points.slice(-2), 72900, now)).toEqual([{ kind: "insufficient" }]);
  });
  it("berechnet den Referenzpreis nach § 11 PAngV (niedrigster Preis der 30 Tage davor)", () => {
    expect(referencePrice30(hist, "Händler A", "new", "2026-11-14T00:00:00Z")).toBe(75900);
    expect(referencePrice30(hist, "Anderer", "new", "2026-11-14T00:00:00Z")).toBeNull();
  });
});

describe("Technischer Vergleich und Kaufberater (Test 4, 5, 17, 24)", () => {
  const a = tv("a", { screenInches: 65, refreshHz: 120, hdmiPorts: 4, energyClassSdr: "F", powerSdrW: 95 });
  const b = tv("b", { screenInches: 65, refreshHz: 100, hdmiPorts: 4, energyClassSdr: "E" });
  it("vergleicht Fernseher und bewertet nur bekannte Merkmale", () => {
    const r = compareProducts([a, b], { refreshHz: 3 });
    const refresh = r.rows.find((x) => x.def.key === "refreshHz")!;
    expect(refresh.bestIdx).toEqual([0]);
    const power = r.rows.find((x) => x.def.key === "powerSdrW")!;
    expect(power.values).toEqual([95, null]);
    expect(power.bestIdx).toEqual([]);
    expect(r.rows.find((x) => x.def.key === "energyClassSdr")!.bestIdx).toEqual([1]);
    expect(r.scores[0]).toBeGreaterThan(r.scores[1]!);
  });
  it("berät nach Budget, Mindestwerten und Kategorie", () => {
    const c = tv("c", { screenInches: 55, refreshHz: 120 });
    const phone: MediaProduct = { ...tv("p", { storageGb: 256 }), category: "smartphones-tablets", schema: "smartphone" };
    const offers = [offer({ productId: "a", priceCents: 79900 }), offer({ productId: "b", priceCents: 69900 }), offer({ productId: "c", priceCents: 49900 })];
    const r = advise([a, b, c, phone], offers, { category: "tv-heimkino", budgetCents: 80000, minimums: { screenInches: 65 }, priorities: {}, allowUsed: false }, now);
    expect(r.picks.map((p) => p.product.id).sort()).toEqual(["a", "b"]);
    expect(r.excluded.find((e) => e.product.id === "c")!.reason).toBe("minimum_failed");
    const tight = advise([a, b], offers, { category: "tv-heimkino", budgetCents: 70000, minimums: {}, priorities: {}, allowUsed: false }, now);
    expect(tight.picks.map((p) => p.product.id)).toEqual(["b"]);
  });
});

describe("SparGuard und Preisalarme (Test 12)", () => {
  it("warnt nur bei belegter Abweichung und kennzeichnet Unbekanntes neutral", () => {
    const peers = [offer({ productId: "x", priceCents: 70000 }), offer({ productId: "x", priceCents: 72000 }), offer({ productId: "x", priceCents: 71000 })];
    const cheap = offer({ productId: "x", priceCents: 30000, merchantImprint: null });
    const s = sparGuard(cheap, [...peers, cheap], now);
    expect(s.map((x) => x.code)).toEqual(expect.arrayContaining(["price_far_below_market", "imprint_unknown"]));
    expect(sparGuard(peers[0], peers, now).filter((x) => x.level === "warning")).toEqual([]);
  });
  it("löst nur bei neuen Angeboten unter der Grenze aus", () => {
    const w = { id: "w", productId: "x", thresholdCents: 70000, condition: "new" as const, createdAt: "2026-11-10T00:00:00Z", notifiedOfferIds: [] };
    const old = offer({ productId: "x", priceCents: 60000, observedAt: "2026-11-01T00:00:00Z" });
    const hit = offer({ productId: "x", priceCents: 68000, shippingCents: 990 });
    const used = offer({ productId: "x", priceCents: 50000, condition: "used" });
    expect(watchMatches([w], [old, hit, used]).map((m) => m.offer.id)).toEqual([hit.id]);
  });
});

describe("Abo-Center (Test 9 + 10)", () => {
  const base: Subscription = {
    id: "s1", name: "Video A", category: "video", priceCents: 1399, cycle: "monthly", startDate: "2025-03-10",
    minTermMonths: 0, renewalMonths: 1, notice: { value: 1, unit: "months" }, status: "active", endsOn: null,
    usage: "often", yearlyOptionCents: null, familyOption: null, priceHistory: [],
  };
  it("rechnet monatlich und jährlich richtig", () => {
    expect(monthlyCents(base)).toBe(1399);
    expect(yearlyCents(base)).toBe(16788);
    expect(monthlyCents({ priceCents: 11988, cycle: "yearly" })).toBe(999);
    expect(yearlyCents({ priceCents: 2997, cycle: "quarterly" })).toBe(11988);
  });
  it("bestimmt den nächsten Zahlungstermin", () => {
    expect(nextPayment(base, now)).toBe("2026-12-10");
    expect(nextPayment({ ...base, startDate: "2026-01-31" }, new Date("2026-02-15T00:00:00Z"))).toBe("2026-02-28");
  });
  it("berechnet Kündigungsfristen nur aus vollständigen Vertragsangaben", () => {
    const t = termInfo({ ...base, minTermMonths: 12, startDate: "2026-01-01", notice: { value: 1, unit: "months" } }, now);
    expect(t).toMatchObject({ known: true, currentTermEnd: "2026-12-31", cancelBy: "2026-12-01" });
    expect(termInfo({ ...base, notice: null }, now)).toEqual({ known: false, missing: ["notice"] });
  });
  it("findet Sparmöglichkeiten nur mit eingetragenen Preisen", () => {
    const b: Subscription = { ...base, id: "s2", name: "Video B", priceCents: 999, usage: "never", yearlyOptionCents: 9999, priceHistory: [{ date: "2026-01-01", priceCents: 899 }, { date: "2026-07-01", priceCents: 999 }] };
    const tips = savingsCheck([base, b]);
    expect(tips.map((x) => x.kind).sort()).toEqual(["duplicate", "price_increase", "unused", "yearly_cheaper"]);
    expect(tips.find((x) => x.kind === "yearly_cheaper")).toMatchObject({ savingCents: 11988 - 9999 });
    expect(subscriptionTotals([base, { ...b, status: "cancelled" }])).toMatchObject({ monthlyCents: 1399, activeCount: 1, cancelledCount: 1 });
  });
});

describe("Familienbudget und Sparziele (Test 15)", () => {
  it("prüft Verteilung und Ausgaben je Bereich", () => {
    const c = checkPlan({ totalCents: 80000, allocations: { food: 40000, household: 10000, streaming: 5000, multimedia: 15000, other: 10000 } }, { food: 33000, streaming: 5600 });
    expect(c.allocatedCents).toBe(80000);
    expect(c.unallocatedCents).toBe(0);
    expect(c.perCategory.find((x) => x.category === "food")!.level).toBe("warn");
    expect(c.perCategory.find((x) => x.category === "streaming")!.level).toBe("over");
    expect(checkPlan({ totalCents: 1000, allocations: { food: 1500 } }, {}).overAllocated).toBe(true);
  });
  it("rechnet Sparziele ohne Zinsversprechen", () => {
    expect(goalProjection({ id: "g", name: "TV", targetCents: 90000, savedCents: 15000, monthlyCents: 15000, createdAt: "" }, now)).toMatchObject({ months: 5, date: "2027-04" });
    expect(goalProjection({ id: "g", name: "TV", targetCents: 90000, savedCents: 0, monthlyCents: 0, createdAt: "" }, now).months).toBeNull();
  });
});

describe("Regression 1.0 (Test 1 + 2)", () => {
  it("Listensummen bleiben unverändert", () => {
    expect(computeListTotals([{ id: "a", quantity: 2, priceCents: 119 }]).confirmedCents).toBe(238);
  });
});

// ---------- Abwärtskompatibilität und Familienbudget-Zuordnung ----------
import { AppDataSchema } from "@/lib/store/schema";
import { householdSpent } from "@/components/budget/Household";

describe("Gespeicherte 1.0-Daten", () => {
  const v1 = {
    version: 1,
    settings: { country: "DE", theme: "light", minSavingsCents: 150, basketGroupBy: "chain" },
    lists: [{ id: "a", name: "Wocheneinkauf", kind: "shopping", createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z", items: [] }],
    budgets: [], purchases: [], alerts: [], favorites: [], scans: [],
  };
  it("werden ohne Verlust gelesen und um leere 2.0-Bereiche ergänzt", () => {
    const r = AppDataSchema.safeParse(v1);
    expect(r.success).toBe(true);
    expect(r.data!.lists[0].name).toBe("Wocheneinkauf");
    expect(r.data!.products).toEqual([]);
    expect(r.data!.subscriptions).toEqual([]);
    expect(r.data!.householdPlan).toBeNull();
  });
});

describe("Familienbudget: Ausgaben je Bereich", () => {
  const labels = { food: "Lebensmittel", household: "Haushalt", electronics: "Elektronik", multimedia: "Multimedia", streaming: "Streaming", gaming: "Gaming", digital: "Digitale Produkte", other: "Sonstiges" };
  it("zählt bezahlte Einkäufe des Monats über die Kategorie und aktive Abos über ihren Bereich", () => {
    const data = AppDataSchema.parse({
      version: 1,
      settings: {},
      lists: [], budgets: [], alerts: [], favorites: [], scans: [],
      purchases: [
        { id: "1", date: "2026-11-03", store: "Markt", amountCents: 5000, kind: "paid", category: "haushalt", member: null },
        { id: "2", date: "2026-11-04", store: "Markt", amountCents: 3000, kind: "planned", category: "Haushalt", member: null },
        { id: "3", date: "2026-10-30", store: "Markt", amountCents: 9999, kind: "paid", category: "Haushalt", member: null },
        { id: "4", date: "2026-11-05", store: "Laden", amountCents: 1200, kind: "paid", category: "Unbekannt", member: null },
      ],
      subscriptions: [
        { id: "s", name: "Video", category: "video", priceCents: 1299, cycle: "monthly", startDate: "2026-01-01", minTermMonths: null, renewalMonths: null, notice: null, status: "active", endsOn: null, usage: null, yearlyOptionCents: null, familyOption: null, priceHistory: [] },
        { id: "c", name: "Alt", category: "gaming", priceCents: 999, cycle: "monthly", startDate: "2026-01-01", minTermMonths: null, renewalMonths: null, notice: null, status: "cancelled", endsOn: "2026-02-01", usage: null, yearlyOptionCents: null, familyOption: null, priceHistory: [] },
      ],
    });
    const spent = householdSpent(data, labels, "2026-11-15");
    expect(spent.household).toBe(5000); // geplant und Vormonat zählen nicht
    expect(spent.other).toBe(1200); // unbekannte Kategorie → Sonstiges
    expect(spent.streaming).toBe(1299);
    expect(spent.gaming).toBeUndefined(); // gekündigtes Abo zählt nicht
  });
});

// ---------- Spiele, fehlende Schlüssel, erlaubte Inhalte, Autopilot ohne Käufe ----------
import { vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

describe("Digitale Spiele nach Plattform und Region (Test 8)", () => {
  const game = (id: string, specs: MediaProduct["specs"]): MediaProduct => ({
    id, category: "gaming", schema: "gaming", brand: "Studio", name: "Spiel", model: "GAME-1", specs, specSource: null, imageUrl: null, wishlist: false, createdAt: "2026-01-01",
  });
  it("trennt PC/Konsole, Region und Edition, erkennt gleiche Version als Duplikat", () => {
    const base = game("a", { platform: "PC", region: "EU", edition: "Standard", format: "digital" });
    expect(findDuplicate(game("b", { platform: "PlayStation 5", region: "EU", edition: "Standard", format: "digital" }), [base])).toBeNull();
    expect(findDuplicate(game("c", { platform: "PC", region: "US", edition: "Standard", format: "digital" }), [base])).toBeNull();
    expect(findDuplicate(game("d", { platform: "PC", region: "EU", edition: "Deluxe", format: "digital" }), [base])).toBeNull();
    expect(findDuplicate(game("e", { platform: "PC", region: "EU", edition: "Standard", format: "digital" }), [base])?.id).toBe("a");
  });
});

vi.mock("server-only", () => ({}));
describe("Fehlende API-Schlüssel (Test 23)", () => {
  it("liefern eine verständliche Meldung statt erfundener Daten", async () => {
    delete process.env.ITAD_API_KEY;
    delete process.env.TMDB_API_TOKEN;
    const games = await (await import("@/app/api/games/route")).GET(new Request("http://x/api/games?q=Portal&country=DE"));
    expect(games.status).toBe(503);
    expect(await games.json()).toMatchObject({ error: "missing_key", source: "itad" });
    const titles = await (await import("@/app/api/titles/route")).GET(new Request("http://x/api/titles?q=Dune&country=IT&lang=it"));
    expect(titles.status).toBe(503);
    expect(await titles.json()).toMatchObject({ error: "missing_key", source: "tmdb" });
  });
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? sourceFiles(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
}
const code = sourceFiles(join(__dirname, "../src")).map((f) => [f, readFileSync(f, "utf8")] as const);

describe("Keine nicht erlaubten Medieninhalte (Test 18)", () => {
  it("bettet weder Videos, Streams, Torrents noch Fremd-Player ein", () => {
    for (const [f, src] of code) {
      expect(src, f).not.toMatch(/<iframe|magnet:|\.torrent|youtube\.com\/embed|<audio/i);
      // einzige Ausnahme: Kamerabild des Barcode-Scanners (lokaler Kamerastream, keine fremden Inhalte)
      if (!f.endsWith("scanner/Scanner.tsx")) expect(src, f).not.toMatch(/<video/i);
    }
  });
});

describe("Autopilot erstellt keine Käufe (Test 16)", () => {
  it("enthält keinen Bestell-, Zahlungs- oder Checkout-Weg; Händlerlinks öffnen nur extern auf Nutzerklick", () => {
    for (const [f, src] of code) {
      expect(src, f).not.toMatch(/checkout|stripe|paypal|klarna|\/cart\/add|placeOrder|createOrder/i);
      // jeder fetch mit POST geht nur an die eigenen Datenquellen (Open Prices/ITAD-Preisabfrage), nie an Händler
      for (const m of src.matchAll(/method:\s*"POST"/g)) expect(src.slice(Math.max(0, m.index! - 300), m.index), f).toMatch(/isthereanydeal\.com\/games\/prices/);
    }
    const external = code.flatMap(([, src]) => [...src.matchAll(/target="_blank"[^>]*/g)].map((m) => m[0]));
    for (const a of external) expect(a).toMatch(/noopener/);
  });
});

// ---------- Einkaufswagen ----------
import { addToCart, cartToListItems, cartTotals, setCartQuantity } from "@/lib/cart";
import { rubrics, rubricOf } from "@/lib/rubrics";
import { mediaCategories } from "@/lib/media/specs";
import { categories } from "@/lib/categories";

describe("Einkaufswagen", () => {
  const base = { detail: null, rubric: null, image: null, priceSource: null, priceStore: null, priceDate: null } as const;
  it("führt gleiche Artikel zusammen, rechnet nur bekannte Preise und übernimmt Quelle in die Liste", () => {
    let cart = addToCart([], { ...base, kind: "food", ref: "4008400401621", name: "Milch", priceCents: 129, priceSource: "open_prices", priceStore: "Lidl", priceDate: "2026-11-10" }, "a", "t");
    cart = addToCart(cart, { ...base, kind: "food", ref: "4008400401621", name: "Milch", priceCents: 129, priceSource: "open_prices", priceStore: "Lidl", priceDate: "2026-11-10" }, "b", "t");
    cart = addToCart(cart, { ...base, kind: "product", ref: "p1", name: "TV", priceCents: null }, "c", "t");
    expect(cart).toHaveLength(2);
    expect(cart[0].quantity).toBe(2);
    expect(cartTotals(cart)).toEqual({ count: 3, knownCents: 258, missing: 1 });
    const items = cartToListItems(cart, () => "x", () => "Rubrik");
    expect(items[0]).toMatchObject({ productCode: "4008400401621", priceSource: "open_prices", priceStore: "Lidl", quantity: 2 });
    expect(items[1]).toMatchObject({ productCode: null, priceCents: null });
    expect(setCartQuantity(cart, "a", 0)).toHaveLength(1);
  });
  it("Rubriken decken alle Kategorien ab, jede Kategorie gehört zu genau einer Rubrik", () => {
    expect(rubrics).toHaveLength(9);
    for (const c of mediaCategories) expect(rubrics.filter((r) => r.products.includes(c.slug)), c.slug).toHaveLength(1);
    for (const c of categories) expect(rubricOf(c.slug, "food"), c.slug).toBeDefined();
  });
});
