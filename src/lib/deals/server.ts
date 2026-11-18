// Server-Helfer für die Angebots-Routen: Laden mit Erstlauf, Live-Suche bei Quellen mit Suchfunktion.
import { allConnectors } from "./connectors";
import { scoreAll } from "./pipeline";
import { connectorState, defaultConfig, loadDeals, runUpdate } from "./runner";
import { getDealStore, keys } from "./store";
import { DealSchema, type AdminConfig, type DealCountry, type RunLog, type ScoredDeal } from "./types";

let bootstrap: Promise<unknown> | null = null;

/** Gibt es noch keinen Lauf (frische Installation), wird einmalig ein Erstlauf angestoßen. */
export async function dealsFor(country: DealCountry): Promise<ScoredDeal[]> {
  const store = await getDealStore();
  const runs = await store.get<RunLog[]>(keys.runs);
  if (!runs?.length) {
    bootstrap ??= runUpdate({ trigger: "erstlauf", force: true, store }).catch(() => null);
    await bootstrap;
  }
  return loadDeals(country, store);
}

/** Live-Suche bei Quellen mit Suchfunktion (z. B. eBay), nur wenn freigeschaltet. */
export async function liveSearch(q: string, country: DealCountry): Promise<ScoredDeal[]> {
  const store = await getDealStore();
  const cfg = { ...defaultConfig, ...((await store.get<AdminConfig>(keys.config)) ?? {}) };
  const now = new Date();
  const searchers = allConnectors().filter((c) => c.search && connectorState(c, cfg, process.env) === "active");
  const found = (await Promise.all(searchers.map((c) => c.search!(q, country, { now, env: process.env }).catch(() => [])))).flat();
  const valid = found.flatMap((r) => {
    const ok = DealSchema.omit({ firstSeen: true }).safeParse(r);
    return ok.success ? [{ ...ok.data, firstSeen: now.toISOString() }] : [];
  });
  return scoreAll(valid, {}, now, new Set());
}
