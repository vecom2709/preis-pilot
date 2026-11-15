// PreisPilot Service Worker – Offline-Fähigkeit ohne Fremdbibliothek.
// Listen, Budgets und Einstellungen liegen im lokalen Speicher und sind offline immer verfügbar;
// der Service Worker hält zusätzlich die App-Seiten und zuletzt geladene Produktdaten bereit.
const VERSION = "pp-v1";
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const PAGES = ["de", "it", "en"].flatMap((l) => [`/${l}`, `/${l}/lists`, `/${l}/budget`, `/${l}/scan`, `/${l}/search`]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => Promise.allSettled(PAGES.concat(["/manifest.webmanifest", "/icons/icon-192.png"]).map((u) => cache.add(u)))).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(RUNTIME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = (await caches.match(request)) || (fallbackUrl && (await caches.match(fallbackUrl)));
    if (cached) return cached;
    throw new Error("offline");
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(RUNTIME)).put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.endsWith(".woff2")) {
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.startsWith("/api/product/") || url.pathname.startsWith("/api/prices")) {
    event.respondWith(networkFirst(request));
  } else if (url.pathname.startsWith("/_next/image")) {
    event.respondWith(cacheFirst(request));
  } else if (request.mode === "navigate") {
    const locale = url.pathname.split("/")[1] || "de";
    event.respondWith(networkFirst(request, `/${["de", "it", "en"].includes(locale) ? locale : "de"}`));
  }
});
