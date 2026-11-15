// Preis-Pilot 2.0 – Best-Price-Engine, Preisverlauf, Varianten, Vergleich, Kaufberater, SparGuard.
// Alle Funktionen sind rein (ohne Netzwerk) und vollständig getestet.
import { sumCents } from "../money";
import { specSchemas, type SpecDef } from "./specs";

export type Condition = "new" | "used" | "refurbished" | "demo" | "digital" | "subscription";
export type Availability = "in_stock" | "limited" | "out_of_stock" | "unknown";

export interface MediaProduct {
  id: string;
  category: string; // slug aus mediaCategories
  schema: string; // Schlüssel in specSchemas
  brand: string;
  name: string;
  /** Herstellermodellnummer – Grundlage für eindeutige Zuordnung */
  model: string;
  specs: Record<string, string | number | boolean>;
  specSource: string | null; // URL des Herstellerdatenblatts
  imageUrl: string | null;
  wishlist: boolean;
  createdAt: string;
}

export interface Offer {
  id: string;
  productId: string;
  merchant: string;
  url: string | null;
  priceCents: number;
  /** null = Versandkosten unbekannt */
  shippingCents: number | null;
  condition: Condition;
  availability: Availability;
  warrantyMonths: number | null;
  /** Zeitpunkt der Preisbeobachtung (ISO) */
  observedAt: string;
  source: "manual" | "feed";
  promo: string | null;
  merchantImprint: boolean | null;
}

// ---------- Varianten: ähnliche Modelle nie verwechseln ----------

export function normalizeModel(model: string): string {
  return model.toUpperCase().replace(/[\s\-_./]/g, "");
}

/** Gleiche Variante nur bei gleicher Marke, gleicher Modellnummer und gleichen Variantenmerkmalen. */
export function sameVariant(a: MediaProduct, b: MediaProduct): boolean {
  if (a.brand.trim().toLowerCase() !== b.brand.trim().toLowerCase()) return false;
  if (!a.model || !b.model || normalizeModel(a.model) !== normalizeModel(b.model)) return false;
  const defs = specSchemas[a.schema] ?? [];
  return defs.filter((d) => d.variant).every((d) => (a.specs[d.key] ?? null) === (b.specs[d.key] ?? null));
}

export function findDuplicate(candidate: MediaProduct, existing: readonly MediaProduct[]): MediaProduct | null {
  return existing.find((p) => p.id !== candidate.id && sameVariant(p, candidate)) ?? null;
}

// ---------- Best-Price-Engine ----------

export const FRESH_HOURS = 24;

export interface RankedOffer extends Offer {
  totalCents: number | null; // null, wenn Versandkosten unbekannt
  fresh: boolean; // nur dann darf „aktuell“ angezeigt werden
  ageHours: number;
}

export function rankOffer(o: Offer, now = new Date()): RankedOffer {
  const ageHours = (now.getTime() - new Date(o.observedAt).getTime()) / 3_600_000;
  return {
    ...o,
    totalCents: o.shippingCents === null ? null : o.priceCents + o.shippingCents,
    fresh: ageHours >= 0 && ageHours <= FRESH_HOURS,
    ageHours,
  };
}

/**
 * Angebote je Zustand getrennt, sortiert nach Gesamtpreis (Preis + Versand).
 * Angebote mit unbekanntem Versand stehen hinter allen mit bekanntem Gesamtpreis.
 * Nicht lieferbare Angebote kommen ans Ende. Je Händler zählt nur die jüngste Beobachtung.
 */
export function bestOffers(offers: readonly Offer[], now = new Date()): Map<Condition, RankedOffer[]> {
  const latest = new Map<string, Offer>();
  for (const o of offers) {
    const key = `${o.condition}|${o.merchant.trim().toLowerCase()}`;
    const prev = latest.get(key);
    if (!prev || o.observedAt > prev.observedAt) latest.set(key, o);
  }
  const groups = new Map<Condition, RankedOffer[]>();
  for (const o of latest.values()) {
    const r = rankOffer(o, now);
    groups.set(o.condition, [...(groups.get(o.condition) ?? []), r]);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => {
      const av = a.availability === "out_of_stock" ? 1 : 0;
      const bv = b.availability === "out_of_stock" ? 1 : 0;
      if (av !== bv) return av - bv;
      if (a.totalCents === null && b.totalCents !== null) return 1;
      if (b.totalCents === null && a.totalCents !== null) return -1;
      return (a.totalCents ?? a.priceCents) - (b.totalCents ?? b.priceCents);
    });
  }
  return groups;
}

// ---------- Preisverlauf, 30-Tage-Referenz, Prognosehinweise ----------

export interface HistoryPoint { day: string; cents: number }

/** Niedrigster Gesamtpreis je Tag (nur bekannte Gesamtpreise, ein Zustand). */
export function dailyLows(offers: readonly Offer[], condition: Condition): HistoryPoint[] {
  const map = new Map<string, number>();
  for (const o of offers) {
    if (o.condition !== condition || o.shippingCents === null) continue;
    const day = o.observedAt.slice(0, 10);
    const total = o.priceCents + o.shippingCents;
    map.set(day, Math.min(map.get(day) ?? Infinity, total));
  }
  return [...map.entries()].map(([day, cents]) => ({ day, cents })).sort((a, b) => a.day.localeCompare(b.day));
}

const DAY = 86_400_000;
const dayNum = (d: string) => Math.floor(new Date(`${d}T00:00:00Z`).getTime() / DAY);

/** Lücken im Verlauf (mehr als `maxGapDays` ohne Beobachtung) – Diagramme zeigen sie sichtbar an. */
export function historyGaps(points: readonly HistoryPoint[], maxGapDays = 7): { from: string; to: string }[] {
  const gaps: { from: string; to: string }[] = [];
  for (let i = 1; i < points.length; i++) {
    if (dayNum(points[i].day) - dayNum(points[i - 1].day) > maxGapDays) gaps.push({ from: points[i - 1].day, to: points[i].day });
  }
  return gaps;
}

export interface WindowStats { days: number; enough: boolean; observations: number; lowCents: number | null; avgCents: number | null }

/** 30-/90-/180-Tage-Auswertung – nur mit ausreichender Datenbasis (mind. 5 Beobachtungstage, Abdeckung ≥ ⅓). */
export function windowStats(points: readonly HistoryPoint[], days: number, now = new Date()): WindowStats {
  const end = Math.floor(now.getTime() / DAY);
  const inWin = points.filter((p) => end - dayNum(p.day) < days && end - dayNum(p.day) >= 0);
  const span = inWin.length ? end - dayNum(inWin[0].day) + 1 : 0;
  const enough = inWin.length >= 5 && span >= days / 3;
  return {
    days,
    enough,
    observations: inWin.length,
    lowCents: inWin.length ? Math.min(...inWin.map((p) => p.cents)) : null,
    avgCents: inWin.length ? Math.round(sumCents(inWin.map((p) => p.cents)) / inWin.length) : null,
  };
}

/**
 * Referenzpreis bei Preisermäßigungen (§ 11 PAngV / Art. 6a RL 98/6/EG): niedrigster Gesamtpreis desselben
 * Händlers in den 30 Tagen vor der Ermäßigung. Ohne Beobachtungen in diesem Zeitraum: null (nicht belegbar).
 */
export function referencePrice30(offers: readonly Offer[], merchant: string, condition: Condition, reductionAt: string): number | null {
  const t = new Date(reductionAt).getTime();
  const prior = offers.filter(
    (o) =>
      o.merchant.trim().toLowerCase() === merchant.trim().toLowerCase() &&
      o.condition === condition &&
      o.shippingCents !== null &&
      new Date(o.observedAt).getTime() < t &&
      t - new Date(o.observedAt).getTime() <= 30 * DAY,
  );
  return prior.length ? Math.min(...prior.map((o) => o.priceCents + o.shippingCents!)) : null;
}

export type ForecastHint =
  | { kind: "insufficient" }
  | { kind: "near_low"; lowCents: number }
  | { kind: "often_lower"; times: number; lowCents: number }
  | { kind: "jump"; percent: number };

/** Vorsichtige Einordnung, keine Vorhersage künftiger Preise. */
export function forecastHints(points: readonly HistoryPoint[], currentCents: number | null, now = new Date()): ForecastHint[] {
  const s90 = windowStats(points, 90, now);
  if (!s90.enough || currentCents === null) return [{ kind: "insufficient" }];
  const hints: ForecastHint[] = [];
  const recent = points.filter((p) => Math.floor(now.getTime() / DAY) - dayNum(p.day) < 90);
  const lower = recent.filter((p) => p.cents < currentCents).length;
  if (s90.lowCents !== null && currentCents <= s90.lowCents * 1.03) hints.push({ kind: "near_low", lowCents: s90.lowCents });
  else if (lower >= 2 && s90.lowCents !== null) hints.push({ kind: "often_lower", times: lower, lowCents: s90.lowCents });
  if (recent.length >= 2) {
    const prev = recent[recent.length - 2].cents;
    const last = recent[recent.length - 1].cents;
    const pct = prev > 0 ? ((last - prev) / prev) * 100 : 0;
    if (Math.abs(pct) >= 20) hints.push({ kind: "jump", percent: Math.round(pct) });
  }
  return hints;
}

// ---------- Technischer Vergleich mit Nutzerprioritäten ----------

const ENUM_RANK: Record<string, string[]> = {
  resolution: ["HD", "Full HD", "4K", "8K"],
  // Rangfolge aufsteigend: höherer Index = besser (A ist die beste Energieklasse)
  energyClassSdr: ["G", "F", "E", "D", "C", "B", "A"],
  energyClass: ["G", "F", "E", "D", "C", "B", "A"],
  fuelClass: ["E", "D", "C", "B", "A"],
  wetClass: ["E", "D", "C", "B", "A"],
};

function numeric(def: SpecDef, v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  if (def.type === "number") return typeof v === "number" && Number.isFinite(v) ? v : null;
  if (def.type === "bool") return v === true ? 1 : v === false ? 0 : null;
  if (def.type === "enum" && ENUM_RANK[def.key]) {
    const i = ENUM_RANK[def.key].indexOf(String(v));
    return i >= 0 ? i : null;
  }
  return null;
}

export interface CompareRow { def: SpecDef; values: (string | number | boolean | null)[]; bestIdx: number[]; differs: boolean }
export interface CompareResult { rows: CompareRow[]; scores: (number | null)[]; coverage: number[] }

/**
 * Vergleicht Produkte desselben Datenblatts. Bewertet wird nur über Merkmale, die bei ALLEN Produkten bekannt sind –
 * fehlende Angaben werden nie aufgefüllt. Prioritäten 0–3 je Merkmal (Standard 1).
 */
export function compareProducts(products: readonly MediaProduct[], priorities: Record<string, number> = {}): CompareResult {
  const schema = specSchemas[products[0]?.schema] ?? [];
  const rows: CompareRow[] = [];
  const scoreSum = products.map(() => 0);
  let weightSum = 0;
  for (const def of schema) {
    const values = products.map((p) => (p.specs[def.key] ?? null) as string | number | boolean | null);
    const known = values.map((v) => v !== null && v !== "");
    const nums = values.map((v) => numeric(def, v));
    let bestIdx: number[] = [];
    if (def.better && nums.every((n) => n !== null)) {
      const target = def.better === "higher" ? Math.max(...(nums as number[])) : Math.min(...(nums as number[]));
      bestIdx = nums.flatMap((n, i) => (n === target ? [i] : []));
      const weight = priorities[def.key] ?? 1;
      const min = Math.min(...(nums as number[]));
      const max = Math.max(...(nums as number[]));
      if (weight > 0 && max > min) {
        weightSum += weight;
        nums.forEach((n, i) => {
          const norm = (n! - min) / (max - min);
          scoreSum[i] += weight * (def.better === "higher" ? norm : 1 - norm);
        });
      }
    }
    const shown = values.filter((_, i) => known[i]).map(String);
    rows.push({ def, values, bestIdx, differs: new Set(shown).size > 1 || known.some((k) => !k) && known.some(Boolean) });
  }
  const coverage = products.map((p) => (schema.length ? schema.filter((d) => p.specs[d.key] !== undefined && p.specs[d.key] !== "").length / schema.length : 0));
  return { rows, scores: products.map((_, i) => (weightSum > 0 ? Math.round((scoreSum[i] / weightSum) * 100) : null)), coverage };
}

// ---------- Kaufberater (regelbasiert, ohne KI) ----------

export interface AdvisorRequest {
  category: string;
  budgetCents: number | null;
  /** Mindestwerte, z. B. { screenInches: 65 } */
  minimums: Record<string, number>;
  priorities: Record<string, number>;
  allowUsed: boolean;
}

export interface AdvisorPick {
  product: MediaProduct;
  bestTotalCents: number | null;
  bestCondition: Condition | null;
  score: number | null;
  pros: string[]; // Merkmalsschlüssel, bei denen das Produkt vorn liegt
  cons: string[];
}

export function advise(products: readonly MediaProduct[], offers: readonly Offer[], req: AdvisorRequest, now = new Date()) {
  const excluded: { product: MediaProduct; reason: "category" | "minimum_unknown" | "minimum_failed" | "over_budget" | "no_price" }[] = [];
  const candidates: { product: MediaProduct; best: RankedOffer | null }[] = [];
  for (const p of products) {
    if (p.category !== req.category) continue;
    const defs = specSchemas[p.schema] ?? [];
    let fail: "minimum_unknown" | "minimum_failed" | null = null;
    for (const [key, min] of Object.entries(req.minimums)) {
      const def = defs.find((d) => d.key === key);
      const n = def ? numeric(def, p.specs[key]) : null;
      if (n === null) { fail = "minimum_unknown"; break; }
      if (n < min) { fail = "minimum_failed"; break; }
    }
    if (fail) { excluded.push({ product: p, reason: fail }); continue; }
    const groups = bestOffers(offers.filter((o) => o.productId === p.id && o.availability !== "out_of_stock"), now);
    const allowed: Condition[] = req.allowUsed ? ["new", "refurbished", "demo", "used", "digital"] : ["new", "digital"];
    const best = allowed.flatMap((c) => groups.get(c) ?? []).filter((o) => o.totalCents !== null).sort((a, b) => a.totalCents! - b.totalCents!)[0] ?? null;
    if (req.budgetCents !== null) {
      if (!best) { excluded.push({ product: p, reason: "no_price" }); continue; }
      if (best.totalCents! > req.budgetCents) { excluded.push({ product: p, reason: "over_budget" }); continue; }
    }
    candidates.push({ product: p, best });
  }
  const cmp = candidates.length >= 2 ? compareProducts(candidates.map((c) => c.product), req.priorities) : null;
  const picks: AdvisorPick[] = candidates.map((c, i) => ({
    product: c.product,
    bestTotalCents: c.best?.totalCents ?? null,
    bestCondition: c.best?.condition ?? null,
    score: cmp?.scores[i] ?? null,
    pros: cmp ? cmp.rows.filter((r) => r.bestIdx.includes(i) && r.bestIdx.length < candidates.length).map((r) => r.def.key) : [],
    cons: cmp ? cmp.rows.filter((r) => r.bestIdx.length > 0 && !r.bestIdx.includes(i)).map((r) => r.def.key) : [],
  }));
  picks.sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || (a.bestTotalCents ?? Infinity) - (b.bestTotalCents ?? Infinity));
  return { picks, excluded };
}

// ---------- SparGuard: Transparenz statt Vorwürfe ----------

export type GuardSignal =
  | { level: "warning"; code: "price_far_below_market"; medianCents: number }
  | { level: "warning"; code: "not_new" }
  | { level: "unknown"; code: "shipping_unknown" | "imprint_unknown" | "warranty_unknown" | "stale" };

/** Warnungen nur bei belegbaren Auffälligkeiten; fehlende Angaben werden als „unbekannt“ gekennzeichnet, nicht als Verdacht. */
export function sparGuard(offer: Offer, siblings: readonly Offer[], now = new Date()): GuardSignal[] {
  const signals: GuardSignal[] = [];
  const peers = siblings.filter((o) => o.id !== offer.id && o.condition === offer.condition && o.shippingCents !== null);
  if (peers.length >= 2 && offer.shippingCents !== null) {
    const totals = peers.map((o) => o.priceCents + o.shippingCents!).sort((a, b) => a - b);
    const m = Math.floor(totals.length / 2);
    const median = totals.length % 2 ? totals[m] : Math.round((totals[m - 1] + totals[m]) / 2);
    if (offer.priceCents + offer.shippingCents < median * 0.6) signals.push({ level: "warning", code: "price_far_below_market", medianCents: median });
  }
  if (offer.condition === "used" || offer.condition === "refurbished" || offer.condition === "demo") signals.push({ level: "warning", code: "not_new" });
  if (offer.shippingCents === null) signals.push({ level: "unknown", code: "shipping_unknown" });
  if (offer.merchantImprint === null) signals.push({ level: "unknown", code: "imprint_unknown" });
  if (offer.warrantyMonths === null && offer.condition !== "digital" && offer.condition !== "subscription") signals.push({ level: "unknown", code: "warranty_unknown" });
  if (!rankOffer(offer, now).fresh) signals.push({ level: "unknown", code: "stale" });
  return signals;
}

// ---------- Preisalarme für Produkte ----------

export interface ProductWatch { id: string; productId: string; thresholdCents: number; condition: Condition; createdAt: string; notifiedOfferIds: string[] }

/** Treffer nur bei neu erfassten Angeboten (nach Einrichtung), bekanntem Gesamtpreis ≤ Grenze und passendem Zustand. */
export function watchMatches(watches: readonly ProductWatch[], offers: readonly Offer[]): { watchId: string; offer: Offer }[] {
  const out: { watchId: string; offer: Offer }[] = [];
  for (const w of watches) {
    for (const o of offers) {
      if (o.productId !== w.productId || o.condition !== w.condition || o.shippingCents === null) continue;
      if (o.observedAt < w.createdAt || w.notifiedOfferIds.includes(o.id)) continue;
      if (o.priceCents + o.shippingCents <= w.thresholdCents && o.availability !== "out_of_stock") out.push({ watchId: w.id, offer: o });
    }
  }
  return out;
}
