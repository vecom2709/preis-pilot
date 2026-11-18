// Verarbeitung eines Aktualisierungslaufs: Zusammenführen, Dubletten, Ablauf, Preisverlauf, Händlervergleich, Score.
import { scoreDeal, totalCents } from "./score";
import type { Deal, HistoryMap, RawDeal, Reference, ScoredDeal } from "./types";

const DAY = 86_400_000;
/** Höchstalter einer Beobachtung je Lieferweg, danach gilt ein Angebot als veraltet und wird entfernt */
export const MAX_AGE_DAYS: Record<Deal["delivery"], number> = { online: 3, digital: 3, store: 14 };

export interface MergeResult { deals: Deal[]; added: number; removed: number; updated: number }

/**
 * - Angebote erfolgreich abgefragter Quellen, die nicht mehr geliefert werden → entfernt (abgelaufen)
 * - Angebote nicht abgefragter Quellen bleiben, solange sie nicht veraltet oder abgelaufen sind
 * - Dubletten: gleiche ID oder gleicher Händler + GTIN + Zustand → jüngste Beobachtung gewinnt
 */
export function mergeDeals(prev: readonly Deal[], fresh: readonly RawDeal[], polled: ReadonlySet<string>, now: Date, disabledMerchants: readonly string[] = []): MergeResult {
  const nowIso = now.toISOString();
  const blocked = new Set(disabledMerchants.map((m) => m.toLowerCase()));
  const prevById = new Map(prev.map((d) => [d.id, d]));
  const out = new Map<string, Deal>();
  let added = 0, updated = 0;

  for (const r of fresh) {
    const old = prevById.get(r.id);
    const d: Deal = { ...r, firstSeen: old?.firstSeen ?? nowIso };
    const cur = out.get(d.id);
    if (!cur || cur.observedAt < d.observedAt) out.set(d.id, d);
  }
  for (const p of prev) {
    if (out.has(p.id) || polled.has(`${p.source}:${p.country}`)) continue;
    out.set(p.id, p);
  }
  // Ablauf, Veraltung, gesperrte Händler
  for (const [id, d] of out) {
    const expired = d.validUntil !== null && Date.parse(d.validUntil) < now.getTime();
    const stale = now.getTime() - Date.parse(d.observedAt) > MAX_AGE_DAYS[d.delivery] * DAY;
    if (expired || stale || blocked.has(d.merchant.toLowerCase())) out.delete(id);
  }
  // Dubletten über GTIN
  const byKey = new Map<string, Deal>();
  for (const d of out.values()) {
    if (!d.gtin) continue;
    const key = `${d.country}|${d.merchant.toLowerCase()}|${d.gtin}|${d.condition}`;
    const other = byKey.get(key);
    if (!other) byKey.set(key, d);
    else {
      const loser = other.observedAt >= d.observedAt ? d : other;
      out.delete(loser.id);
      byKey.set(key, loser === d ? other : d);
    }
  }
  const deals = [...out.values()];
  const freshIds = new Set(fresh.map((r) => r.id));
  for (const d of deals) {
    if (!freshIds.has(d.id)) continue;
    if (prevById.has(d.id)) updated++;
    else added++;
  }
  const removed = prev.filter((p) => !out.has(p.id)).length;
  return { deals, added, removed, updated };
}

/** Tagestiefstpreis je Angebot fortschreiben, 90 Tage behalten. Es werden nur echte Beobachtungen gespeichert. */
export function updateHistory(history: HistoryMap, deals: readonly Deal[], now: Date): HistoryMap {
  const today = now.toISOString().slice(0, 10);
  const cutoff = new Date(now.getTime() - 90 * DAY).toISOString().slice(0, 10);
  const next: HistoryMap = {};
  const live = new Set(deals.map((d) => d.id));
  for (const [id, rows] of Object.entries(history)) {
    const kept = rows.filter(([day]) => day >= cutoff);
    if (kept.length && (live.has(id) || kept[kept.length - 1][0] >= cutoff)) next[id] = kept;
  }
  for (const d of deals) {
    const day = d.observedAt.slice(0, 10);
    const rows = next[d.id] ? [...next[d.id]] : [];
    const last = rows[rows.length - 1];
    if (last && last[0] === day) last[1] = Math.min(last[1], d.priceCents);
    else if (!last || last[0] < day) rows.push([day, d.priceCents]);
    next[d.id] = rows;
  }
  void today;
  return next;
}

/** Niedrigster eigener Preis der 30 Tage vor der Beobachtung – nur bei ausreichender Abdeckung (≥ 20 Tage). */
export function lowest30(rows: readonly [string, number][], observedAt: string): number | null {
  const end = observedAt.slice(0, 10);
  const start = new Date(Date.parse(end) - 30 * DAY).toISOString().slice(0, 10);
  const win = rows.filter(([day]) => day >= start && day < end);
  if (win.length < 20) return null;
  return Math.min(...win.map(([, c]) => c));
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2);
};

export function scoreAll(deals: readonly Deal[], history: HistoryMap, now: Date, trusted: ReadonlySet<string>): ScoredDeal[] {
  const groups = new Map<string, Deal[]>();
  for (const d of deals) {
    if (!d.gtin) continue;
    const key = `${d.country}|${d.gtin}|${d.condition}`;
    groups.set(key, [...(groups.get(key) ?? []), d]);
  }
  return deals.map((d) => {
    const rows = history[d.id] ?? [];
    const refs: Reference[] = d.references.filter((r) => r.kind !== "lowest30" && r.kind !== "market");
    const low = lowest30(rows, d.observedAt);
    if (low !== null) refs.push({ kind: "lowest30", cents: low });
    let cheapestOther: { merchant: string; totalCents: number } | null = null;
    if (d.gtin) {
      const others = (groups.get(`${d.country}|${d.gtin}|${d.condition}`) ?? []).filter((o) => o.merchant !== d.merchant);
      const totals = others.map((o) => ({ merchant: o.merchant, totalCents: totalCents(o) })).filter((o): o is { merchant: string; totalCents: number } => o.totalCents !== null);
      if (totals.length) cheapestOther = totals.reduce((a, b) => (b.totalCents < a.totalCents ? b : a));
      if (totals.length >= 2) refs.push({ kind: "market", cents: median(totals.map((t) => t.totalCents)) });
    }
    return scoreDeal({ ...d, references: refs }, { now, cheapestOther, history: rows, trustedSource: trusted.has(d.source) });
  });
}
