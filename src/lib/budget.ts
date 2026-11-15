// Budgetberechnung: geplante, geschätzte und tatsächlich bezahlte Beträge bleiben getrennt.
import { sumCents } from "./money";

export type BudgetPeriod = "purchase" | "day" | "week" | "month";
export type CostKind = "planned" | "estimated" | "paid";

export interface Budget {
  id: string;
  name: string;
  period: BudgetPeriod;
  limitCents: number;
  category: string | null;
  member: string | null;
  /** Warnschwelle in Prozent (Standard 80) */
  warnAtPercent: number;
}

export interface Purchase {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  store: string;
  amountCents: number;
  kind: CostKind;
  category: string | null;
  member: string | null;
  note: string;
  source: "manual" | "receipt" | "list";
}

export type BudgetLevel = "ok" | "warn" | "over";

export interface BudgetStatus {
  paidCents: number;
  estimatedCents: number;
  plannedCents: number;
  remainingCents: number;
  /** bezahlter Anteil am Limit in Prozent */
  usedPercent: number;
  level: BudgetLevel;
  /** inkl. geplanter/geschätzter Kosten – zeigt, ob das Budget voraussichtlich reicht */
  projectedLevel: BudgetLevel;
  range: { start: string; end: string } | null;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Zeitraum (inklusive) des Budgets zum Stichtag. Woche beginnt am Montag (DE/IT). */
export function periodRange(period: BudgetPeriod, now: Date): { start: string; end: string } | null {
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  if (period === "purchase") return null;
  if (period === "day") return { start: iso(d), end: iso(d) };
  if (period === "week") {
    const dow = (d.getUTCDay() + 6) % 7;
    const start = new Date(d);
    start.setUTCDate(d.getUTCDate() - dow);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    return { start: iso(start), end: iso(end) };
  }
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  return { start: iso(start), end: iso(end) };
}

function level(amount: number, limit: number, warnAt: number): BudgetLevel {
  if (limit <= 0) return amount > 0 ? "over" : "ok";
  if (amount > limit) return "over";
  if ((amount / limit) * 100 >= warnAt) return "warn";
  return "ok";
}

export function relevantPurchases(budget: Budget, purchases: readonly Purchase[], now: Date): Purchase[] {
  const range = periodRange(budget.period, now);
  return purchases.filter(
    (p) =>
      (!range || (p.date >= range.start && p.date <= range.end)) &&
      (!budget.category || p.category === budget.category) &&
      (!budget.member || p.member === budget.member),
  );
}

export function budgetStatus(budget: Budget, purchases: readonly Purchase[], now = new Date()): BudgetStatus {
  let rel = relevantPurchases(budget, purchases, now);
  if (budget.period === "purchase") {
    // Budget pro Einkauf: maßgeblich ist der zuletzt erfasste Einkauf.
    const latest = [...rel].sort((a, b) => b.date.localeCompare(a.date))[0];
    rel = latest ? [latest] : [];
  }
  const by = (k: CostKind) => sumCents(rel.filter((p) => p.kind === k).map((p) => p.amountCents));
  const paid = by("paid");
  const estimated = by("estimated");
  const planned = by("planned");
  return {
    paidCents: paid,
    estimatedCents: estimated,
    plannedCents: planned,
    remainingCents: budget.limitCents - paid,
    usedPercent: budget.limitCents > 0 ? (paid / budget.limitCents) * 100 : 0,
    level: level(paid, budget.limitCents, budget.warnAtPercent),
    projectedLevel: level(paid + estimated + planned, budget.limitCents, budget.warnAtPercent),
    range: periodRange(budget.period, now),
  };
}

/** Summen bezahlter Einkäufe je Monat (YYYY-MM), für den Vergleich vergangener Monate. */
export function monthlyTotals(purchases: readonly Purchase[], months: number, now = new Date()): { month: string; paidCents: number }[] {
  const out: { month: string; paidCents: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
    const key = d.toISOString().slice(0, 7);
    out.push({
      month: key,
      paidCents: sumCents(purchases.filter((p) => p.kind === "paid" && p.date.startsWith(key)).map((p) => p.amountCents)),
    });
  }
  return out;
}

export function totalsByCategory(purchases: readonly Purchase[]): { category: string; paidCents: number }[] {
  const map = new Map<string, number>();
  for (const p of purchases) {
    if (p.kind !== "paid") continue;
    const k = p.category ?? "";
    map.set(k, (map.get(k) ?? 0) + p.amountCents);
  }
  return [...map.entries()].map(([category, paidCents]) => ({ category, paidCents })).sort((a, b) => b.paidCents - a.paidCents);
}

/** Erkennt doppelte Kaufbuchungen: gleicher Tag, gleiches Geschäft, gleicher Betrag, gleiche Art. */
export function purchaseFingerprint(p: Pick<Purchase, "date" | "store" | "amountCents" | "kind">): string {
  return [p.date, p.store.trim().toLowerCase().replace(/\s+/g, " "), p.amountCents, p.kind].join("|");
}

export function findDuplicatePurchase(candidate: Omit<Purchase, "id">, existing: readonly Purchase[]): Purchase | null {
  const fp = purchaseFingerprint(candidate);
  return existing.find((p) => purchaseFingerprint(p) === fp) ?? null;
}
