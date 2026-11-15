// Live-Tests gegen die laufende App und die echten Datenquellen.
// Start: App starten (npm run dev oder npm start), dann  LIVE=1 PP_BASE_URL=http://localhost:3000 npm run test:live
import { describe, expect, it } from "vitest";

const BASE = process.env.PP_BASE_URL ?? "http://localhost:3000";
const get = async (path: string) => {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, body: await res.json().catch(() => null) };
};

describe.skipIf(!process.env.LIVE)("Live: echte Daten über die Preis-Pilot-API", () => {
  it("Produktsuche liefert tatsächlich vorhandene Daten (DE und IT)", async () => {
    for (const [q, country, lang] of [["Milch", "DE", "de"], ["pasta", "IT", "it"]]) {
      const r = await get(`/api/search?q=${q}&country=${country}&lang=${lang}`);
      expect(r.status).toBe(200);
      expect(r.body.hits.length).toBeGreaterThan(0);
      expect(r.body.hits[0].code).toMatch(/^\d{8,14}$/);
    }
  }, 30_000);

  it("Barcode-Eingabe in der Suche führt direkt zum Produkt", async () => {
    const r = await get(`/api/search?q=4008400401621`);
    expect(r.body).toEqual({ barcode: "4008400401621" });
  });

  it("Produkt per Barcode laden, unbekannter Barcode ergibt 404 statt erfundener Daten", async () => {
    const ok = await get(`/api/product/4008400401621?lang=de`);
    expect(ok.status).toBe(200);
    expect(ok.body.product.packageBase).toBeGreaterThan(0);
    const missing = await get(`/api/product/2079003502222?lang=de`);
    expect(missing.status).toBe(404);
    const invalid = await get(`/api/product/4008400401622`);
    expect(invalid.status).toBe(400);
  }, 30_000);

  it("Preise enthalten Händler, Datum, Quelle, Datentyp und Qualitätsbewertung", async () => {
    const r = await get(`/api/prices?codes=4008400401621&country=DE`);
    expect(r.status).toBe(200);
    for (const o of r.body.observations) {
      expect(o.store.countryCode).toBe("DE");
      expect(o.currency).toBe("EUR");
      expect(o.source).toBe("open_prices");
      expect(o.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof o.quality.usable).toBe("boolean");
    }
  }, 30_000);

  it("Angebote werden ohne Gültigkeitsnachweis nie als aktuell ausgegeben", async () => {
    for (const country of ["DE", "IT"]) {
      const r = await get(`/api/offers?country=${country}`);
      expect(r.status).toBe(200);
      for (const o of r.body.offers) {
        expect(o.store.countryCode).toBe(country);
        expect(o.status).not.toBe("current");
      }
    }
  }, 30_000);

  it("ungültige Eingaben werden abgewiesen", async () => {
    expect((await get(`/api/search?q=a`)).status).toBe(400);
    expect((await get(`/api/prices?codes=123`)).status).toBe(400);
    expect((await get(`/api/offers?country=FR`)).status).toBe(400);
  });

  it("Sprachrouten, hreflang, Sitemap und Manifest sind erreichbar", async () => {
    for (const l of ["de", "it", "en"]) {
      const res = await fetch(`${BASE}/${l}`);
      const html = await res.text();
      expect(res.status).toBe(200);
      expect(html).toContain(`<html lang="${l}"`);
      expect(html).toMatch(/hrefLang="it"|hreflang="it"/i);
    }
    expect((await fetch(`${BASE}/sitemap.xml`)).status).toBe(200);
    expect((await fetch(`${BASE}/manifest.webmanifest`)).status).toBe(200);
    expect((await fetch(`${BASE}/sw.js`)).status).toBe(200);
  }, 60_000);
});
