import { describe, expect, it } from "vitest";
import { formatCents, multiplyCents, toCents } from "@/lib/money";
import { comparePacks, packsNeeded, parseQuantity, toQuantity, unitPrice } from "@/lib/units";
import { isValidGtin, normalizeBarcode } from "@/lib/barcode";

describe("Geldbeträge (dezimalgenau)", () => {
  it("liest deutsche, italienische und englische Schreibweisen", () => {
    expect(toCents("2,49")).toBe(249);
    expect(toCents("2.49")).toBe(249);
    expect(toCents("1.234,50 €")).toBe(123450);
    expect(toCents(1.005)).toBe(101);
    expect(toCents("abc")).toBeNull();
    expect(toCents("2,499")).toBeNull();
  });
  it("vermeidet Gleitkommafehler", () => {
    expect(toCents(0.1)! + toCents(0.2)!).toBe(30);
    expect(multiplyCents(333, 3)).toBe(999);
  });
  it("formatiert je Sprache", () => {
    expect(formatCents(249, "de-DE")).toMatch(/2,49\s?€/);
    expect(formatCents(249, "it-IT")).toMatch(/2,49\s?€/);
  });
});

describe("Kilopreise und Packungsgrößen (Test 4 + 5)", () => {
  it("berechnet den Kilopreis korrekt", () => {
    expect(unitPrice(249, toQuantity(500, "g"))).toBeCloseTo(498);
    expect(unitPrice(329, toQuantity(750, "g"))).toBeCloseTo(438.667, 2);
    expect(unitPrice(119, parseQuantity("1,5 l"))).toBeCloseTo(79.333, 2);
  });
  it("erkennt die günstigere Packung (Beispiel aus dem Auftrag)", () => {
    const r = comparePacks([
      { id: "A", priceCents: 249, quantity: toQuantity(500, "g") },
      { id: "B", priceCents: 329, quantity: toQuantity(750, "g") },
    ]);
    expect(r.comparable).toBe(true);
    if (r.comparable) {
      expect(r.cheapestId).toBe("B");
      expect(r.spreadPercent).toBeCloseTo(11.92, 1);
    }
  });
  it("vergleicht keine unterschiedlichen Mengenarten oder unbekannte Mengen", () => {
    expect(comparePacks([
      { id: "A", priceCents: 100, quantity: toQuantity(1, "kg") },
      { id: "B", priceCents: 100, quantity: toQuantity(1, "l") },
    ])).toEqual({ comparable: false, reason: "different_dimension" });
    expect(comparePacks([
      { id: "A", priceCents: 100, quantity: null },
      { id: "B", priceCents: 100, quantity: toQuantity(1, "l") },
    ])).toEqual({ comparable: false, reason: "missing_quantity" });
  });
  it("liest Mehrfachpackungen und berechnet benötigte Packungen", () => {
    expect(parseQuantity("6 x 1,5 l")).toEqual({ base: 9000, dimension: "volume" });
    expect(parseQuantity("4x125g")).toEqual({ base: 500, dimension: "mass" });
    expect(parseQuantity("ca. 500 g")).toBeNull();
    expect(packsNeeded(toQuantity(2, "l")!, toQuantity(1, "l")!)).toBe(2);
    expect(packsNeeded(toQuantity(1, "kg")!, toQuantity(400, "g")!)).toBe(3);
    expect(packsNeeded(toQuantity(1, "kg")!, toQuantity(1, "l")!)).toBeNull();
  });
});

describe("Barcode-Prüfung (Test 2)", () => {
  it("akzeptiert gültige EAN-13, EAN-8 und UPC-A", () => {
    expect(isValidGtin("4008400401621")).toBe(true);
    expect(isValidGtin("96385074")).toBe(true);
    expect(isValidGtin("036000291452")).toBe(true);
  });
  it("lehnt falsche Prüfziffern und Formate ab", () => {
    expect(isValidGtin("4008400401622")).toBe(false);
    expect(normalizeBarcode("4008 4004 0162 1")).toBe("4008400401621");
    expect(normalizeBarcode("12345")).toBeNull();
  });
});
