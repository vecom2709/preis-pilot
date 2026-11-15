// Abo-Center: Kosten, Zahlungstermine, Kündigungsfristen und Sparcheck – nur aus Angaben des Nutzers.
import { sumCents } from "./money";

export type Cycle = "weekly" | "monthly" | "quarterly" | "yearly";
export type SubCategory = "video" | "music" | "gaming" | "cloud" | "software" | "productivity" | "media" | "other";
export type Usage = "often" | "sometimes" | "rarely" | "never";

export interface Subscription {
  id: string;
  name: string;
  category: SubCategory;
  priceCents: number;
  cycle: Cycle;
  /** Vertragsbeginn YYYY-MM-DD */
  startDate: string;
  /** Mindestlaufzeit in Monaten (0 = monatlich kündbar), null = unbekannt */
  minTermMonths: number | null;
  /** Verlängerung nach der Mindestlaufzeit in Monaten, null = unbekannt */
  renewalMonths: number | null;
  /** Kündigungsfrist, null = unbekannt */
  notice: { value: number; unit: "days" | "weeks" | "months" } | null;
  status: "active" | "cancelled";
  /** bei gekündigten Verträgen: Vertragsende laut Bestätigung */
  endsOn: string | null;
  usage: Usage | null;
  /** öffentlich geprüfter oder bestätigter Jahrespreis (optional) */
  yearlyOptionCents: number | null;
  /** Familientarif: Preis je Abrechnungszeitraum und Anzahl Personen, die ihn nutzen würden */
  familyOption: { priceCents: number; people: number } | null;
  priceHistory: { date: string; priceCents: number }[];
}

const MONTHS_PER: Record<Cycle, number> = { weekly: 12 / 52, monthly: 1, quarterly: 3, yearly: 12 };

export function monthlyCents(s: Pick<Subscription, "priceCents" | "cycle">): number {
  return Math.round(s.priceCents / MONTHS_PER[s.cycle]);
}

export function yearlyCents(s: Pick<Subscription, "priceCents" | "cycle">): number {
  return s.cycle === "weekly" ? s.priceCents * 52 : Math.round((s.priceCents * 12) / MONTHS_PER[s.cycle]);
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const parse = (s: string) => new Date(`${s}T00:00:00Z`);

function addMonths(d: Date, months: number): Date {
  const r = new Date(d);
  const day = r.getUTCDate();
  r.setUTCDate(1);
  r.setUTCMonth(r.getUTCMonth() + months);
  const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
  r.setUTCDate(Math.min(day, last));
  return r;
}

/** Nächster Zahlungstermin ab heute (Abrechnung jeweils am Beginn eines Zeitraums). */
export function nextPayment(s: Pick<Subscription, "startDate" | "cycle" | "status" | "endsOn">, today = new Date()): string | null {
  const t = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  let d = parse(s.startDate);
  let i = 0;
  while (d.getTime() < t && i < 2000) {
    d = s.cycle === "weekly" ? new Date(d.getTime() + 7 * 86_400_000) : addMonths(parse(s.startDate), MONTHS_PER[s.cycle] * ++i);
  }
  if (s.status === "cancelled" && s.endsOn && iso(d) >= s.endsOn) return null;
  return iso(d);
}

export interface TermInfo { known: false; missing: ("minTerm" | "renewal" | "notice")[] }
export interface TermResult { known: true; currentTermEnd: string; cancelBy: string; daysLeft: number }

/**
 * Ende des laufenden Vertragszeitraums und letzter Kündigungstag – nur wenn Mindestlaufzeit, Verlängerung
 * und Kündigungsfrist bekannt sind. Sonst werden die fehlenden Angaben benannt.
 */
export function termInfo(s: Subscription, today = new Date()): TermInfo | TermResult {
  const missing: TermInfo["missing"] = [];
  if (s.minTermMonths === null) missing.push("minTerm");
  if (s.renewalMonths === null) missing.push("renewal");
  if (s.notice === null) missing.push("notice");
  if (missing.length) return { known: false, missing };
  const t = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const start = parse(s.startDate);
  // Ende (exklusiv) des ersten Zeitraums: Mindestlaufzeit, sonst eine Verlängerungsperiode, mindestens 1 Monat
  const step = Math.max(1, s.renewalMonths!);
  let end = addMonths(start, s.minTermMonths! > 0 ? s.minTermMonths! : step);
  const cancelByOf = (e: Date) => {
    const n = s.notice!;
    if (n.unit === "months") return addMonths(e, -n.value);
    return new Date(e.getTime() - n.value * (n.unit === "weeks" ? 7 : 1) * 86_400_000);
  };
  let guard = 0;
  while (cancelByOf(end).getTime() < t && guard++ < 1000) end = addMonths(end, step);
  const cancelBy = cancelByOf(end);
  return { known: true, currentTermEnd: iso(new Date(end.getTime() - 86_400_000)), cancelBy: iso(cancelBy), daysLeft: Math.round((cancelBy.getTime() - t) / 86_400_000) };
}

export type SavingTip =
  | { kind: "duplicate"; category: SubCategory; ids: string[]; yearlyCents: number }
  | { kind: "yearly_cheaper"; id: string; savingCents: number }
  | { kind: "unused"; id: string; yearlyCents: number }
  | { kind: "family"; id: string; savingCents: number }
  | { kind: "price_increase"; id: string; fromCents: number; toCents: number; percent: number };

/** Abo-Sparcheck: rechnet ausschließlich mit eingetragenen bzw. bestätigten Tarifpreisen. */
export function savingsCheck(subs: readonly Subscription[]): SavingTip[] {
  const active = subs.filter((s) => s.status === "active");
  const tips: SavingTip[] = [];
  const byCat = new Map<SubCategory, Subscription[]>();
  for (const s of active) byCat.set(s.category, [...(byCat.get(s.category) ?? []), s]);
  for (const [category, list] of byCat) {
    if (list.length >= 2 && category !== "other") tips.push({ kind: "duplicate", category, ids: list.map((s) => s.id), yearlyCents: sumCents(list.map(yearlyCents)) });
  }
  for (const s of active) {
    if (s.yearlyOptionCents !== null && s.cycle !== "yearly") {
      const saving = yearlyCents(s) - s.yearlyOptionCents;
      if (saving > 0) tips.push({ kind: "yearly_cheaper", id: s.id, savingCents: saving });
    }
    if (s.usage === "rarely" || s.usage === "never") tips.push({ kind: "unused", id: s.id, yearlyCents: yearlyCents(s) });
    if (s.familyOption && s.familyOption.people > 1) {
      // Vergleich: alle Personen einzeln zum aktuellen Preis vs. ein Familientarif (gleicher Abrechnungszeitraum)
      const saving = s.priceCents * s.familyOption.people - s.familyOption.priceCents;
      if (saving > 0) tips.push({ kind: "family", id: s.id, savingCents: Math.round((saving * 12) / MONTHS_PER[s.cycle]) });
    }
    const hist = [...s.priceHistory].sort((a, b) => a.date.localeCompare(b.date));
    if (hist.length >= 2) {
      const from = hist[hist.length - 2].priceCents;
      const to = hist[hist.length - 1].priceCents;
      if (to > from) tips.push({ kind: "price_increase", id: s.id, fromCents: from, toCents: to, percent: Math.round(((to - from) / from) * 100) });
    }
  }
  return tips;
}

export function subscriptionTotals(subs: readonly Subscription[]) {
  const active = subs.filter((s) => s.status === "active");
  return { monthlyCents: sumCents(active.map(monthlyCents)), yearlyCents: sumCents(active.map(yearlyCents)), activeCount: active.length, cancelledCount: subs.length - active.length };
}
