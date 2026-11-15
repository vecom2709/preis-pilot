// Browser-Tests (echter Chrome): PWA offline (Test 16), Export/Löschung (Test 14), Listen-Summe (Test 6),
// Doppelbuchung (Test 12), Sprachen DE/IT (Test 17).
// Aufruf: App starten (npm run build && npm start), dann
//   CHROME_PATH=/pfad/zu/chrome PP_BASE_URL=http://localhost:3000 npm run test:e2e
import puppeteer from "puppeteer-core";
import assert from "node:assert/strict";

const BASE = process.env.PP_BASE_URL ?? "http://localhost:3000";
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const results = [];
async function test(name, fn) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  try { await fn(page); results.push(["✓", name]); } catch (e) { results.push(["✗", `${name}: ${e.message}`]); } finally { await page.close(); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clickText = async (page, text) => { const [el] = await page.$$(`xpath/.//button[contains(., '${text}')]`); assert.ok(el, `Knopf „${text}“ fehlt`); await el.click(); };

await test("Liste: Artikel anlegen, Summe sofort aktualisiert, fehlender Preis ausgewiesen", async (page) => {
  await page.goto(`${BASE}/de/lists`, { waitUntil: "networkidle0" });
  await clickText(page, "Neue Liste");
  await page.type("#li-name", "Vollmilch 1 l"); await page.$eval("#li-qty", (el) => (el.value = "")); await page.type("#li-qty", "2"); await page.type("#li-price", "1,19");
  await page.keyboard.press("Enter"); await sleep(200);
  await page.type("#li-name", "Tomaten"); await page.keyboard.press("Enter"); await sleep(300);
  const text = await page.$eval("main", (m) => m.innerText);
  assert.match(text, /2,38\s?€/); assert.match(text, /1 ohne Preis/);
});

await test("Budget: Doppelbuchung wird erkannt", async (page) => {
  await page.goto(`${BASE}/de/budget`, { waitUntil: "networkidle0" });
  for (let i = 0; i < 2; i++) { await page.type("#pf-store", i ? "" : "Testmarkt"); await page.type("#pf-amount", "42,10"); await clickText(page, "Einkauf buchen"); await sleep(300); }
  const text = await page.$eval("main", (m) => m.innerText);
  assert.match(text, /ist schon gebucht/);
});

await test("Konto: Export liefert JSON, Löschen entfernt alle Daten", async (page) => {
  await page.goto(`${BASE}/de/privacy`);
  await page.evaluate(() => localStorage.setItem("preispilot:v1", JSON.stringify({ version: 1, settings: { country: "DE", theme: "light", minSavingsCents: 150, basketGroupBy: "chain" }, lists: [{ id: "a", name: "X", kind: "shopping", createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z", items: [] }], budgets: [], purchases: [], alerts: [], favorites: [], scans: [] })));
  await page.goto(`${BASE}/de/account`, { waitUntil: "networkidle0" });
  const cdp = await page.createCDPSession();
  await cdp.send("Browser.setDownloadBehavior", { behavior: "allowAndName", downloadPath: "/tmp/pp-e2e-dl", eventsEnabled: true });
  const done = new Promise((r) => cdp.on("Browser.downloadProgress", (e) => e.state === "completed" && r(true)));
  await clickText(page, "Alle Daten exportieren");
  assert.equal(await Promise.race([done, sleep(5000).then(() => false)]), true, "kein Download");
  page.on("dialog", (d) => d.accept());
  await clickText(page, "Alle Daten löschen"); await sleep(300);
  assert.equal(await page.evaluate(() => localStorage.getItem("preispilot:v1")), null);
});

await test("PWA: Service Worker aktiv, Listen offline erreichbar", async (page) => {
  await page.goto(`${BASE}/de/lists`, { waitUntil: "networkidle0" });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload({ waitUntil: "networkidle0" }); await sleep(1500);
  await page.setOfflineMode(true);
  await page.goto(`${BASE}/de/lists`, { waitUntil: "domcontentloaded" });
  const h1 = await page.$eval("h1", (h) => h.textContent);
  assert.equal(h1, "Einkaufslisten");
  await page.setOfflineMode(false);
});

await test("Sprachen: Italienisch mit korrekter Sprache und Zahlenformat", async (page) => {
  await page.goto(`${BASE}/it`, { waitUntil: "networkidle0" });
  assert.equal(await page.$eval("html", (h) => h.lang), "it");
  assert.match(await page.$eval("main", (m) => m.innerText), /La piattaforma smart/);
  await page.goto(`${BASE}/it/search`, { waitUntil: "networkidle0" });
  const text = await page.$eval("main", (m) => m.innerText);
  assert.match(text, /Quale confezione conviene\?/); assert.match(text, /4,39\s?€/);
});

await test("Startseite: Suche führt zum Preisvergleich, Kategorien und Planer verlinkt", async (page) => {
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE}/de`, { waitUntil: "networkidle0" });
  await page.type("#hero-q", "Nutella"); await page.keyboard.press("Enter");
  await page.waitForFunction(() => location.pathname.endsWith("/search") && location.search.includes("Nutella"), { timeout: 10000 });
  await page.goto(`${BASE}/de`, { waitUntil: "networkidle0" });
  const hrefs = await page.$$eval("main a", (as) => as.map((a) => a.getAttribute("href")));
  for (const h of ["/de/categories", "/de/category/getraenke", "/de/lists", "/de/comparisons", "/de/scan", "/de/insights"]) assert.ok(hrefs.includes(h), `Link fehlt: ${h}`);
});

await browser.close();
for (const [s, n] of results) console.log(s, n);
process.exit(results.some(([s]) => s === "✗") ? 1 : 0);
