// Logiktests mit konstruierten Testobjekten (keine echten Marktpreise – nur Rechenregeln).
import { describe, expect, it } from "vitest";
import { computeListTotals } from "@/lib/list-totals";
import { budgetStatus, findDuplicatePurchase, monthlyTotals, periodRange, type Budget, type Purchase } from "@/lib/budget";
import { optimizeBasket } from "@/lib/basket";
import { assessObservations, usableObservations } from "@/lib/price-quality";
import { detectIncrease, evaluateAlerts, type PriceAlert } from "@/lib/alerts";
import type { PriceObservation } from "@/lib/sources/types";

let n = 0;
type ObsInput = { code: string; cents: number; chain: string; date?: string; store?: Partial<PriceObservation["store"]> };
function obs({ code, cents, chain, date = "2026-11-10", store }: ObsInput): PriceObservation {
  n++;
  return {
    id: `t-${n}`, source: "open_prices", dataType: "price_tag", productCode: code, productName: null,
    priceCents: cents, currency: "EUR", pricePer: "item", isDiscounted: false, priceWithoutDiscountCents: null,
    discountType: null, date, recordedAt: `${date}T10:00:00Z`,
    store: { locationId: n, name: chain, chain, city: "Testort", countryCode: "DE", lat: null, lon: null, ...store },
    duplicateOf: null, proofUrl: null, validFrom: null, validUntil: null,
  };
}

describe("Einkaufslisten-Summen (Test 3 + 6)", () => {
  it("summiert bekannte Preise und kennzeichnet fehlende", () => {
    const t = computeListTotals([
      { id: "a", quantity: 2, priceCents: 119, checked: true },
      { id: "b", quantity: 1, priceCents: 249 },
      { id: "c", quantity: 3, priceCents: null },
    ]);
    expect(t.confirmedCents).toBe(487);
    expect(t.checkedCents).toBe(238);
    expect(t.missingIds).toEqual(["c"]);
    expect(t.complete).toBe(false);
  });
  it("ist nur vollständig, wenn jede Position einen Preis hat", () => {
    expect(computeListTotals([{ id: "a", quantity: 1, priceCents: 100 }]).complete).toBe(true);
    expect(computeListTotals([]).complete).toBe(false);
  });
});

describe("Budget (Test 7 + 12)", () => {
  const budget: Budget = { id: "b", name: "Lebensmittel", period: "month", limitCents: 35000, category: null, member: null, warnAtPercent: 80 };
  const p = (amount: number, kind: Purchase["kind"] = "paid", date = "2026-11-05"): Purchase =>
    ({ id: `${amount}-${kind}-${date}`, date, store: "Testmarkt", amountCents: amount, kind, category: null, member: null, note: "", source: "manual" });
  const now = new Date(2026, 10, 15);

  it("rechnet das Beispiel aus dem Auftrag: 350 € Budget, 214 € ausgegeben", () => {
    const s = budgetStatus(budget, [p(21400)], now);
    expect(s.remainingCents).toBe(13600);
    expect(s.level).toBe("ok");
  });
  it("warnt ab 80 % und meldet Überschreitung", () => {
    expect(budgetStatus(budget, [p(28000)], now).level).toBe("warn");
    expect(budgetStatus(budget, [p(35001)], now).level).toBe("over");
  });
  it("trennt geplante, geschätzte und bezahlte Kosten", () => {
    const s = budgetStatus(budget, [p(20000), p(10000, "estimated"), p(9000, "planned")], now);
    expect([s.paidCents, s.estimatedCents, s.plannedCents]).toEqual([20000, 10000, 9000]);
    expect(s.level).toBe("ok");
    expect(s.projectedLevel).toBe("over");
  });
  it("berücksichtigt nur den laufenden Zeitraum", () => {
    expect(budgetStatus(budget, [p(30000, "paid", "2026-10-31")], now).paidCents).toBe(0);
    expect(periodRange("week", new Date(2026, 10, 15))).toEqual({ start: "2026-11-09", end: "2026-11-15" });
    expect(monthlyTotals([p(1000, "paid", "2026-10-03"), p(500)], 2, now)).toEqual([
      { month: "2026-10", paidCents: 1000 },
      { month: "2026-11", paidCents: 500 },
    ]);
  });
  it("erkennt doppelte Kaufbuchungen", () => {
    const existing = [p(4210)];
    const { id: _id, ...again } = { ...p(4210), store: "  testmarkt " };
    expect(findDuplicatePurchase(again, existing)).not.toBeNull();
    const { id: _id2, ...other } = p(4211);
    expect(findDuplicatePurchase(other, existing)).toBeNull();
  });
});

describe("Smart Basket (Test 8)", () => {
  const items = [
    { id: "milch", productCode: "1", packs: 2 },
    { id: "nudeln", productCode: "2", packs: 1 },
    { id: "kaese", productCode: "3", packs: 1 },
    { id: "eier", productCode: null, packs: 1 },
  ];
  const data = [
    obs({ code: "1", cents: 109, chain: "Markt A" }), obs({ code: "2", cents: 99, chain: "Markt A" }), obs({ code: "3", cents: 249, chain: "Markt A" }),
    obs({ code: "1", cents: 99, chain: "Markt B" }), obs({ code: "2", cents: 89, chain: "Markt B" }),
    obs({ code: "3", cents: 199, chain: "Markt C" }),
  ];
  const r = optimizeBasket(items, data, { groupBy: "chain", minSavingsCents: 50 });

  it("weist Positionen ohne Preis als fehlend aus und schätzt nichts", () => {
    expect(r.unlinkedItemIds).toEqual(["eier"]);
    expect(r.single!.store.label).toBe("Markt A");
    expect(r.single!.complete).toBe(true);
    expect(r.single!.store.subtotalCents).toBe(109 * 2 + 99 + 249);
    expect(r.single!.store.missingItemIds).toEqual(["eier"]);
    const b = r.stores.find((s) => s.label === "Markt B")!;
    expect(b.missingItemIds).toContain("kaese");
  });
  it("berechnet Ersparnis bei Aufteilung nur über belegte Positionen", () => {
    expect(r.split).not.toBeNull();
    expect(r.split!.savingsCents).toBeGreaterThan(0);
    expect(r.split!.comparedItemIds.sort()).toEqual(["kaese", "milch", "nudeln"]);
  });
  it("lässt Nutzer über die Mindestersparnis entscheiden", () => {
    const strict = optimizeBasket(items, data, { groupBy: "chain", minSavingsCents: 10_000 });
    expect(strict.split!.worthIt).toBe(false);
  });
  it("nimmt je Geschäft den jüngsten Preis", () => {
    const r2 = optimizeBasket([{ id: "x", productCode: "9", packs: 1 }], [
      obs({ code: "9", cents: 300, chain: "M", date: "2026-10-01" }),
      obs({ code: "9", cents: 250, chain: "M", date: "2026-11-01" }),
    ], { groupBy: "chain", minSavingsCents: 0 });
    expect(r2.single!.store.subtotalCents).toBe(250);
  });
});

describe("Preisqualität", () => {
  const now = new Date("2026-11-15T12:00:00Z");
  it("markiert veraltete, doppelte, unplausible und Ausreißer", () => {
    const base = obs({ code: "5", cents: 200, chain: "Q", store: { locationId: 1 } });
    const list = [
      base,
      { ...base, id: "dup" },
      obs({ code: "5", cents: 210, chain: "Q" }),
      obs({ code: "5", cents: 190, chain: "Q" }),
      obs({ code: "5", cents: 2000, chain: "Q" }),
      obs({ code: "5", cents: 0, chain: "Q" }),
      obs({ code: "6", cents: 100, chain: "Q", date: "2025-01-01" }),
      obs({ code: "6", cents: 100, chain: "Q", date: "2026-07-01" }),
    ];
    const q = assessObservations(list, now);
    expect(q.get("dup")!.flags).toContain("duplicate");
    expect(q.get(list[4].id)!.flags).toContain("outlier");
    expect(q.get(list[5].id)!.flags).toContain("implausible");
    expect(q.get(list[6].id)!.flags).toContain("outdated");
    expect(q.get(list[7].id)!.flags).toEqual(["stale"]);
    expect(usableObservations(list, now).map((o) => o.id)).not.toContain("dup");
  });
});

describe("Preisalarme (Test 10)", () => {
  const alert: PriceAlert = { id: "k", productCode: "77", productName: "Kaffee", thresholdCents: 500, country: "DE", createdAt: "2026-11-01T08:00:00Z", notifiedIds: [] };
  it("reagiert nur auf passende, neue Datensätze", () => {
    const hit = obs({ code: "77", cents: 479, chain: "K", date: "2026-11-12" });
    const tooOld = obs({ code: "77", cents: 399, chain: "K", date: "2026-10-20" });
    const tooHigh = obs({ code: "77", cents: 529, chain: "K", date: "2026-11-12" });
    const otherCountry = obs({ code: "77", cents: 450, chain: "K", date: "2026-11-12", store: { countryCode: "IT" } });
    const m = evaluateAlerts([alert], [hit, tooOld, tooHigh, otherCountry]);
    expect(m.map((x) => x.observation.id)).toEqual([hit.id]);
    expect(evaluateAlerts([{ ...alert, notifiedIds: [hit.id] }], [hit])).toEqual([]);
  });
  it("erkennt auffällige Preiserhöhungen am selben Standort", () => {
    const a = obs({ code: "8", cents: 200, chain: "Z", date: "2026-10-01", store: { locationId: 5 } });
    const b = obs({ code: "8", cents: 260, chain: "Z", date: "2026-11-01", store: { locationId: 5 } });
    expect(detectIncrease([a, b])!.percent).toBeCloseTo(30);
  });
});
