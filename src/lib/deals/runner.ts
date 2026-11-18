// Ein Aktualisierungslauf: fällige Quellen abrufen (mit Wiederholung), prüfen, zusammenführen, bewerten, speichern,
// protokollieren. Läuft als geplante Netlify-Funktion, per Admin-Knopf oder lokal per Skript.
import { allConnectors, type Connector } from "./connectors";
import { withRetry } from "./http";
import { mergeDeals, scoreAll, updateHistory } from "./pipeline";
import { getDealStore, keys, type DealStore } from "./store";
import { COUNTRIES, DealSchema, type AdminConfig, type Deal, type DealCountry, type HistoryMap, type RawDeal, type RunLog, type ScoredDeal, type SourceRun } from "./types";

export const defaultConfig: AdminConfig = { disabledSources: [], disabledMerchants: [], intervals: {} };

export function connectorState(c: Connector, cfg: AdminConfig, env: Record<string, string | undefined>): "active" | "needs_key" | "disabled" {
  if (cfg.disabledSources.includes(c.key)) return "disabled";
  return c.env.every((v) => !!env[v]) ? "active" : "needs_key";
}

export interface RunOptions {
  trigger: RunLog["trigger"];
  force?: boolean;
  now?: Date;
  store?: DealStore;
  connectors?: Connector[];
  env?: Record<string, string | undefined>;
}

export async function runUpdate(opts: RunOptions): Promise<RunLog> {
  const now = opts.now ?? new Date();
  const env = opts.env ?? process.env;
  const store = opts.store ?? (await getDealStore());
  const cfg = { ...defaultConfig, ...((await store.get<AdminConfig>(keys.config)) ?? {}) };
  const lastPoll = (await store.get<Record<string, string>>(keys.lastPoll)) ?? {};
  const connectors = (opts.connectors ?? allConnectors(env)).filter((c) => connectorState(c, cfg, env) === "active");
  const sources: SourceRun[] = [];
  const log: RunLog = { id: now.toISOString(), trigger: opts.trigger, startedAt: now.toISOString(), finishedAt: "", sources, added: 0, removed: 0, updated: 0, total: 0 };

  // Länder parallel – ein Lauf bleibt so auch unter dem Zeitlimit der Server-Funktionen
  await Promise.all(COUNTRIES.map(async (country) => {
    const due = connectors.filter((c) => {
      if (!c.countries.includes(country)) return false;
      if (opts.force) return true;
      const last = lastPoll[`${c.key}:${country}`];
      const every = (cfg.intervals[c.key] ?? c.intervalMinutes) * 60_000;
      return !last || now.getTime() - Date.parse(last) >= every - 60_000;
    });
    const fresh: RawDeal[] = [];
    const polled = new Set<string>();
    await Promise.all(
      due.map(async (c) => {
        const t0 = Date.now();
        try {
          const { value, attempts } = await withRetry(() => c.fetch(country, { now, env }));
          let rejected = 0;
          for (const raw of value) {
            const ok = DealSchema.omit({ firstSeen: true }).safeParse(raw);
            if (ok.success) fresh.push(ok.data);
            else rejected++;
          }
          polled.add(`${c.key}:${country}`);
          lastPoll[`${c.key}:${country}`] = now.toISOString();
          sources.push({ source: c.key, country, ok: true, fetched: value.length - rejected, rejected, error: null, attempts, ms: Date.now() - t0 });
        } catch (e) {
          const attempts = (e as { attempts?: number }).attempts ?? 1;
          sources.push({ source: c.key, country, ok: false, fetched: 0, rejected: 0, error: e instanceof Error ? e.message.slice(0, 200) : "Fehler", attempts, ms: Date.now() - t0 });
        }
      }),
    );
    const prevScored = (await store.get<ScoredDeal[]>(keys.deals(country))) ?? [];
    const prev: Deal[] = prevScored.map(stripScore);
    const merged = mergeDeals(prev, fresh, polled, now, cfg.disabledMerchants);
    const history = updateHistory((await store.get<HistoryMap>(keys.history(country))) ?? {}, merged.deals, now);
    const trusted = new Set(connectors.filter((c) => c.trusted).map((c) => c.key));
    const scored = scoreAll(merged.deals, history, now, trusted).sort((a, b) => b.score - a.score);
    await store.set(keys.deals(country), scored);
    await store.set(keys.history(country), history);
    log.added += merged.added;
    log.removed += merged.removed;
    log.updated += merged.updated;
    log.total += scored.length;
  }));
  await store.set(keys.lastPoll, lastPoll);
  log.finishedAt = new Date().toISOString();
  const runs = (await store.get<RunLog[]>(keys.runs)) ?? [];
  await store.set(keys.runs, [log, ...runs].slice(0, 100));
  return log;
}

const SCORE_FIELDS = ["totalCents", "basis", "discountPercent", "savingCents", "score", "reasons", "cheaperElsewhere", "priceDropAt"] as const;

function stripScore(s: ScoredDeal): Deal {
  const deal: Record<string, unknown> = { ...s };
  for (const k of SCORE_FIELDS) delete deal[k];
  return deal as unknown as Deal;
}

export async function loadDeals(country: DealCountry, store?: DealStore): Promise<ScoredDeal[]> {
  const s = store ?? (await getDealStore());
  return (await s.get<ScoredDeal[]>(keys.deals(country))) ?? [];
}
