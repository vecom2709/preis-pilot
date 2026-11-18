// Speicher der Angebots-Engine: auf Netlify „Netlify Blobs“ (serverseitig, auch ohne Besucher aktuell),
// lokal Dateien unter .data/deals. Beide mit derselben einfachen JSON-Schnittstelle.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface DealStore {
  kind: "blobs" | "file";
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
}

function fileStore(dir = process.env.DEALS_DATA_DIR ?? join(process.cwd(), ".data", "deals")): DealStore {
  const path = (key: string) => join(dir, `${key.replace(/[^a-z0-9._-]/gi, "_")}.json`);
  return {
    kind: "file",
    async get<T>(key: string) {
      try {
        return JSON.parse(await readFile(path(key), "utf8")) as T;
      } catch {
        return null;
      }
    },
    async set(key, value) {
      await mkdir(dir, { recursive: true });
      await writeFile(path(key), JSON.stringify(value));
    },
  };
}

let cached: Promise<DealStore> | null = null;

export function getDealStore(): Promise<DealStore> {
  if (process.env.DEALS_STORE === "file") return Promise.resolve(fileStore());
  cached ??= (async () => {
    try {
      const { getStore } = await import("@netlify/blobs");
      const store = getStore({ name: "preis-pilot-deals", consistency: "strong" });
      await store.get("probe"); // wirft ohne Netlify-Umgebung
      return {
        kind: "blobs",
        async get<T>(key: string) {
          return ((await store.get(key, { type: "json" })) as T | null) ?? null;
        },
        async set(key: string, value: unknown) {
          await store.setJSON(key, value);
        },
      } satisfies DealStore;
    } catch {
      return fileStore();
    }
  })();
  return cached;
}

export const keys = {
  deals: (country: string) => `deals-${country}`,
  history: (country: string) => `history-${country}`,
  runs: "runs",
  lastPoll: "last-poll",
  config: "admin-config",
  watchHits: "watch-hits",
};
