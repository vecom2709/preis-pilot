// Barrierefreiheit (WCAG 2.2 AA, axe-core) für zentrale Seiten beider Welten, mobil und Desktop.
// Aufruf: App starten, dann CHROME_PATH=… PP_BASE_URL=http://localhost:3000 node tests/e2e/a11y.mjs
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const BASE = process.env.PP_BASE_URL ?? "http://localhost:3000";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const pages = ["/de", "/de/search", "/de/lists", "/de/budget", "/de/radar", "/de/offers", "/de/offers/lebensmittel-getraenke", "/de/sources", "/it", "/de/r/lebensmittel", "/de/r/elektronik-technik", "/it/r/multimedia-entertainment", "/de/produkte", "/de/produkte/c/tv-heimkino", "/de/produkte/c/gaming", "/de/produkte/compare", "/de/produkte/advisor", "/de/produkte/abos", "/en/produkte/abos"];
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? "/usr/bin/google-chrome", args: ["--no-sandbox"] });
let failed = 0;
for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  for (const path of pages) {
    const page = await browser.newPage();
    await page.setViewport(vp);
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0" });
    await page.addScriptTag({ content: axeSource });
    const res = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] })).violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target}`));
    console.log(res.length ? "✗" : "✓", `${vp.width}px ${path}`, res.join(" | "));
    failed += res.length;
    await page.close();
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
