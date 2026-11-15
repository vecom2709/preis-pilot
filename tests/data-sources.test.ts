// Tests gegen echte, unveränderte API-Antworten (tests/fixtures, siehe README.txt).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mapOffProduct, mapSearchResponse } from "@/lib/sources/off-map";
import { mapPricesPage } from "@/lib/sources/prices-map";
import { offerStatus } from "@/lib/price-quality";

const fixture = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));

describe("Open Food Facts (Test 1)", () => {
  it("bildet ein echtes Produkt mit Packungsgröße ab", () => {
    const p = mapOffProduct(fixture("off-product-4008400401621.json"), "de");
    expect(p).not.toBeNull();
    expect(p!.code).toBe("4008400401621");
    expect(p!.name).toBe("Nutella");
    expect(p!.packageBase).toBe(450);
    expect(p!.packageDimension).toBe("mass");
    expect(p!.imageUrl).toMatch(/^https:\/\/images\.openfoodfacts\.org\//);
  });
  it("liefert null für unbekannte Barcodes statt erfundener Daten", () => {
    expect(mapOffProduct(fixture("off-product-notfound.json"), "de")).toBeNull();
  });
  it("liefert Suchtreffer nur mit Barcode und Namen", () => {
    const r = mapSearchResponse(fixture("off-search-nutella-de.json"), "de");
    expect(r.hits.length).toBeGreaterThan(0);
    expect(r.hits.every((h) => /^\d{8,14}$/.test(h.code) && h.name)).toBe(true);
  });
});

describe("Open Prices", () => {
  const { items } = mapPricesPage(fixture("prices-4008400401621.json"));
  it("übernimmt Preis, Währung, Datum, Händler und Nachweisart", () => {
    expect(items.length).toBeGreaterThan(0);
    for (const o of items) {
      expect(Number.isInteger(o.priceCents)).toBe(true);
      expect(o.currency).toBe("EUR");
      expect(o.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(o.source).toBe("open_prices");
      expect(o.store.name.length).toBeGreaterThan(0);
      expect(["price_tag", "receipt", "shop_import", "gdpr_request", "unproven"]).toContain(o.dataType);
    }
  });
  it("bewirbt reduzierte Preise ohne Gültigkeitsnachweis nie als aktuell (Test 9)", () => {
    for (const o of items) expect(offerStatus(o)).not.toBe("current");
    const proven = { ...items[0], isDiscounted: true, validFrom: "2026-11-01", validUntil: "2026-11-30" };
    expect(offerStatus(proven, new Date("2026-11-15"))).toBe("current");
    expect(offerStatus(proven, new Date("2026-12-02"))).toBe("expired");
    expect(offerStatus({ ...proven, validUntil: null }, new Date("2026-11-15"))).toBe("documented");
  });
});
