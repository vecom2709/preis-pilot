// Browser-Tests (echter Chrome): PWA offline (Test 16), Export/Löschung (Test 14), Listen-Summe (Test 6),
// Doppelbuchung (Test 12), Sprachen DE/IT (Test 17); 2.0: Multimedia-Welt, Varianten, Bestpreis, Vergleich,
// Abo-Center, Familienbudget, Abwärtskompatibilität.
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
const clickText = async (page, text) => { const [el] = await page.$$(`xpath/.//button[contains(., '${text}')]`); assert.ok(el, `Knopf „${text}“ fehlt`); await el.evaluate((e) => e.scrollIntoView({ block: "center" })); await el.click(); };

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

// ---------- Preis-Pilot 2.0 ----------
const v1Data = { version: 1, settings: { country: "DE", theme: "light", minSavingsCents: 150, basketGroupBy: "chain" }, lists: [{ id: "a", name: "Altliste", kind: "shopping", createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z", items: [] }], budgets: [], purchases: [], alerts: [], favorites: [], scans: [] };
const addTv = async (page, model, inches, hz) => {
  await page.goto(`${BASE}/de/produkte/c/tv-heimkino`, { waitUntil: "networkidle0" });
  await clickText(page, "Produkt anlegen");
  await page.type("#pf-brand", "Testmarke"); await page.type("#pf-name", `Test-TV ${inches}`); await page.type("#pf-model", model);
  await page.type("#pf-screenInches", String(inches)); await page.type("#pf-refreshHz", String(hz));
  await clickText(page, "Speichern"); await sleep(600);
};

await test("2.0: Rubriken-Leiste wechselt zwischen allen Rubriken, alte 1.0-Daten bleiben erhalten", async (page) => {
  await page.goto(`${BASE}/de`);
  await page.evaluate((d) => localStorage.setItem("preispilot:v1", JSON.stringify(d)), v1Data);
  await page.goto(`${BASE}/de`, { waitUntil: "networkidle0" });
  const links = await page.$$eval("header nav[aria-label='Rubriken'] a", (as) => as.map((a) => a.textContent.trim()));
  assert.equal(links.length, 9, `9 Rubriken erwartet, gefunden: ${links.join(", ")}`);
  const [mm] = await page.$$(`xpath/.//header//nav[@aria-label='Rubriken']//a[contains(., 'Multimedia & Entertainment')]`);
  await mm.evaluate((e) => e.scrollIntoView({ inline: "center" })); await mm.click();
  await page.waitForFunction(() => location.pathname === "/de/r/multimedia-entertainment", { timeout: 10000 });
  assert.match(await page.$eval("main", (m) => m.innerText), /Aktuelle Preisvergleiche – Top Angebote/);
  const [garten] = await page.$$(`xpath/.//header//nav[@aria-label='Rubriken']//a[contains(., 'Garten & Heimwerken')]`);
  await garten.evaluate((e) => e.scrollIntoView({ inline: "center" })); await garten.click();
  await page.waitForFunction(() => location.pathname === "/de/r/garten-heimwerken", { timeout: 10000 });
  assert.equal(await page.$eval("header nav[aria-label='Rubriken'] a[aria-current='page']", (a) => a.textContent.trim()), "Garten & Heimwerken");
  await page.goto(`${BASE}/de/lists`, { waitUntil: "networkidle0" });
  assert.match(await page.$eval("main", (m) => m.innerText), /Altliste/);
});

await test("2.0: Produkt anlegen, gleiche Variante abgewiesen, andere Größe erlaubt", async (page) => {
  await addTv(page, "TT-65X1", 65, 120);
  assert.match(page.url(), /\/de\/produkte\/product\?id=/);
  await addTv(page, "tt 65 x1", 65, 120);
  assert.match(await page.$eval("main", (m) => m.innerText), /Diese Variante gibt es schon/);
  await addTv(page, "TT-55X1", 55, 100);
  assert.match(page.url(), /\/de\/produkte\/product\?id=/);
});

await test("2.0: Angebote – Gesamtpreis mit Versand, unbekannter Versand hinten, SparGuard, Bestpreis", async (page) => {
  await addTv(page, "TT-77Z", 77, 144);
  for (const [m, price, ship] of [["Shop A", "999", "0"], ["Shop B", "949", ""], ["Shop C", "979", "9,90"]]) {
    await clickText(page, "Angebot erfassen");
    await page.type("#of-merchant", m); await page.type("#of-price", price); if (ship) await page.type("#of-ship", ship);
    await clickText(page, "Speichern"); await sleep(400);
  }
  const text = await page.$eval("main", (m) => m.innerText);
  const a = text.indexOf("Shop A"), c = text.indexOf("Shop C"), b = text.indexOf("Shop B");
  assert.ok(c < a && a < b, "Reihenfolge nach Gesamtpreis falsch (unbekannter Versand muss hinten stehen)");
  assert.match(text, /Bester Gesamtpreis/); assert.match(text, /988,90\s?€/); assert.match(text, /Versand unbekannt/); assert.match(text, /aktuell/);
});

await test("2.0: Technischer Vergleich mit Punktwert und Datenblatt-Abdeckung", async (page) => {
  await page.goto(`${BASE}/de/produkte/compare?cat=tv-heimkino`, { waitUntil: "networkidle0" });
  const boxes = await page.$$("main input[type=checkbox]");
  assert.ok(boxes.length >= 2, "zu wenige Produkte"); await boxes[0].click(); await boxes[1].click(); await sleep(300);
  const text = await page.$eval("main", (m) => m.innerText);
  assert.match(text, /Punkte nach deinen Prioritäten/); assert.match(text, /Datenblatt vollständig zu \d+ %/);
});

await test("2.0: Abo-Center – unbekannte Frist benannt, Doppel-Abo im Sparcheck", async (page) => {
  await page.goto(`${BASE}/de/produkte/abos`, { waitUntil: "networkidle0" });
  for (const name of ["Video Eins", "Video Zwei"]) {
    await clickText(page, "Abo hinzufügen");
    await page.type("#ab-name", name); await page.type("#ab-price", "12,99");
    await clickText(page, "Speichern"); await sleep(400);
  }
  const text = await page.$eval("main", (m) => m.innerText);
  assert.match(text, /25,98\s?€/); assert.match(text, /Kündigungstermin unbekannt/); assert.match(text, /2 Abos in „Film & Serien“/);
});

await test("2.0: Familienbudget rechnet Abos und Einkäufe nach Bereich", async (page) => {
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE}/de/budget`, { waitUntil: "networkidle0" });
  await clickText(page, "Familienbudget anlegen");
  await page.type("#hh-total", "800"); await page.type("#hh-streaming", "30"); await page.type("#hh-household", "100");
  await clickText(page, "Plan speichern"); await sleep(400);
  const text = await page.$eval("main", (m) => m.innerText);
  assert.match(text, /Streaming/); assert.match(text, /25,98\s?€ von 30,00\s?€/); assert.match(text, /670,00\s?€ noch nicht verteilt/);
});

await test("Einkaufswagen: sammelt aus mehreren Rubriken, Summe nur aus bekannten Preisen, wird zur Einkaufsliste", async (page) => {
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE}/de/produkte/c/tv-heimkino`, { waitUntil: "networkidle0" });
  const [row] = await page.$$(`xpath/.//main//li[.//a[contains(., 'Test-TV 77')]]//button[contains(@aria-label, 'In den Einkaufswagen')]`);
  assert.ok(row, "Wagen-Knopf in der Produktzeile fehlt"); await row.click(); await row.click(); await sleep(300);
  await addTv(page, "TT-43K", 43, 60); // Produkt ohne Angebot = ohne Preis
  await clickText(page, "In den Einkaufswagen"); await sleep(300);
  const badge = await page.$eval("header button[aria-haspopup='dialog'][aria-label^='Einkaufswagen']", (b) => b.innerText);
  assert.match(badge, /3/);
  await (await page.$("header button[aria-label^='Einkaufswagen']")).click(); await sleep(300);
  const panel = await page.$eval("[role=dialog][aria-label='Einkaufswagen']", (d) => d.innerText);
  assert.match(panel, /Elektronik & Technik/); assert.match(panel, /Test-TV 77/); assert.match(panel, /1\.977,80\s?€/); assert.match(panel, /1 Artikel ohne Preis/);
  await clickText(page, "Als Einkaufsliste speichern"); await sleep(400);
  assert.match(await page.$eval("[role=dialog][aria-label='Einkaufswagen']", (d) => d.innerText), /Gespeichert in „Einkauf vom/);
  const lists = await page.evaluate(() => JSON.parse(localStorage.getItem("preispilot:v1")).lists);
  const made = lists.find((l) => l.name.startsWith("Einkauf vom"));
  assert.ok(made, "Liste aus dem Wagen fehlt");
  assert.equal(made.items.length, 2);
  assert.deepEqual(made.items.map((i) => [i.quantity, i.priceCents]), [[2, 98890], [1, null]]);
  assert.equal(await page.$eval("header button[aria-label^='Einkaufswagen']", (b) => b.innerText.trim()), "0");
});

// ---------- Preis-Pilot 3.0: Angebots-Engine ----------
const ADMIN = process.env.PP_ADMIN_TOKEN;

await test("3.0: Startseite zeigt Live-Angebote mit echten Bildern, Gesamtpreis und gültigen Händlerlinks", async (page) => {
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE}/de`, { waitUntil: "networkidle0" });
  await page.waitForSelector("#live-title ~ section article, section[aria-labelledby='live-title'] article", { timeout: 20000 });
  // Bilder laden „lazy“ – jede geprüfte Karte erst in den sichtbaren Bereich holen
  for (const a of (await page.$$("section[aria-labelledby='live-title'] article")).slice(0, 8)) {
    await a.evaluate((e) => e.scrollIntoView({ block: "center", inline: "center" }));
    await a.$eval("img", (img) => (img.complete ? null : new Promise((r) => { img.onload = r; img.onerror = r; }))).catch(() => null);
  }
  const cards = await page.$$eval("section[aria-labelledby='live-title'] article", (as) => as.slice(0, 8).map((a) => ({
    img: a.querySelector("img")?.naturalWidth ?? 0,
    href: a.querySelector("a[target=_blank]")?.getAttribute("href") ?? "",
    rel: a.querySelector("a[target=_blank]")?.getAttribute("rel") ?? "",
    text: a.innerText,
  })));
  assert.ok(cards.length >= 4, "zu wenige Angebote");
  for (const c of cards) {
    assert.ok(c.img > 0, "Produktbild nicht geladen");
    assert.match(c.href, /^https:\/\//);
    assert.match(c.rel, /noopener/);
    assert.match(c.text, /Score/);
    assert.match(c.text, /geprüft|gesehen am/);
  }
});

await test("3.0: Angebotssuche filtert nach Kategorie und sortiert nach Gesamtpreis", async (page) => {
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE}/de/offers/gaming-konsolen?sort=total`, { waitUntil: "networkidle0" });
  await page.waitForSelector("main article", { timeout: 20000 });
  const prices = await page.$$eval("main article", (as) => as.slice(0, 6).map((a) => {
    const t = a.querySelector(".price")?.textContent ?? "";
    return Number(t.replace(/[^\d,]/g, "").replace(",", "."));
  }));
  for (let i = 1; i < prices.length; i++) assert.ok(prices[i] >= prices[i - 1], `Sortierung falsch: ${prices.join(" ")}`);
  assert.match(await page.$eval("main", (m) => m.innerText), /\d+ Angebote/);
});

await test("3.0: Preisalarm auf ein Angebot löst aus und erscheint in Glocke und SparRadar", async (page) => {
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE}/de/offers?sort=score`, { waitUntil: "networkidle0" });
  await page.waitForSelector("main article", { timeout: 20000 });
  const first = (await page.$$("main article"))[0];
  const priceText = await first.$eval(".price", (e) => e.textContent);
  const cents = Math.round(Number(priceText.replace(/[^\d,]/g, "").replace(",", ".")) * 100);
  await first.$eval("button[aria-label^='Preisalarm']", (b) => b.click());
  await first.$eval("input[name=target]", (i, v) => { i.value = v; }, ((cents + 100) / 100).toFixed(2).replace(".", ","));
  await first.$eval("form button[type=submit]", (b) => b.click());
  await sleep(500);
  assert.ok(await page.$("header a[aria-label*='Preisalarm']"), "Glocke mit ausgelöstem Alarm fehlt");
  await page.goto(`${BASE}/de/radar`, { waitUntil: "networkidle0" });
  assert.match(await page.$eval("#angebotsalarme", (e) => e.innerText), /Unter deinem Wunschpreis/);
});

await test("3.0: Mobil – Filter einklappbar, Angebote sofort sichtbar", async (page) => {
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${BASE}/de/offers`, { waitUntil: "networkidle0" });
  await page.waitForSelector("main article", { timeout: 20000 });
  assert.equal(await page.$eval("#deal-filters", (e) => getComputedStyle(e).display), "none");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(overflow <= 1, `waagerechter Überlauf ${overflow}px`);
});

if (ADMIN) await test("3.0: Admin geschützt, zeigt Quellenstatus und startet Aktualisierung", async (page) => {
  assert.equal((await fetch(`${BASE}/de/admin`)).status, 401);
  assert.equal((await fetch(`${BASE}/de/admin`, { headers: { Authorization: `Basic ${Buffer.from("admin:falsch").toString("base64")}` } })).status, 401);
  await page.setExtraHTTPHeaders({ Authorization: `Basic ${Buffer.from(`admin:${ADMIN}`).toString("base64")}` });
  await page.goto(`${BASE}/de/admin`, { waitUntil: "networkidle0" });
  const text = await page.$eval("main", (m) => m.innerText);
  for (const s of ["Datenquellen angebunden", "Aktive Shops", "API- und Datenfeed-Status", "Historie der automatischen Aktualisierungen", "Open Prices", "GOG.com", "Steam"]) assert.ok(text.includes(s), `fehlt: ${s}`);
  await clickText(page, "Jetzt aktualisieren");
  await page.waitForFunction(() => /\badmin\b/.test(document.querySelector("main")?.innerText ?? ""), { timeout: 45000 });
});

await browser.close();
for (const [s, n] of results) console.log(s, n);
process.exit(results.some(([s]) => s === "✗") ? 1 : 0);
