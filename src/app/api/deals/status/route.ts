import { allConnectors, pendingSources } from "@/lib/deals/connectors";
import { connectorState, defaultConfig, loadDeals } from "@/lib/deals/runner";
import { getDealStore, keys } from "@/lib/deals/store";
import type { AdminConfig, RunLog } from "@/lib/deals/types";

// Öffentlicher Status der Datenquellen (ohne Zugangsdaten): angebunden, aktiv, letzte erfolgreiche Abfrage.
export async function GET() {
  const store = await getDealStore();
  const cfg = { ...defaultConfig, ...((await store.get<AdminConfig>(keys.config)) ?? {}) };
  const runs = (await store.get<RunLog[]>(keys.runs)) ?? [];
  const [de, it] = await Promise.all([loadDeals("DE", store), loadDeals("IT", store)]);
  const sources = allConnectors().map((c) => {
    const lastOk = runs.flatMap((r) => r.sources.filter((s) => s.source === c.key && s.ok).map(() => r.finishedAt))[0] ?? null;
    const lastErr = runs[0]?.sources.find((s) => s.source === c.key && !s.ok)?.error ?? null;
    return { key: c.key, label: c.label, kind: c.kind, homepage: c.homepage, state: connectorState(c, cfg, process.env), countries: c.countries, intervalMinutes: cfg.intervals[c.key] ?? c.intervalMinutes, lastOk, lastError: lastErr, deals: { DE: de.filter((d) => d.source === c.key).length, IT: it.filter((d) => d.source === c.key).length } };
  });
  return Response.json({
    store: store.kind,
    lastRun: runs[0] ? { finishedAt: runs[0].finishedAt, trigger: runs[0].trigger, added: runs[0].added, removed: runs[0].removed } : null,
    totals: { DE: de.length, IT: it.length },
    merchants: new Set([...de, ...it].map((d) => d.merchant)).size,
    sources,
    pending: pendingSources.filter((p) => !sources.some((s) => s.key === p.key && s.state === "active")),
  }, { headers: { "Cache-Control": "public, max-age=60" } });
}
