// Familienbudget und Sparziele – rechnerisch, ohne Zinsen oder Renditeversprechen.
import { sumCents } from "./money";

export const HOUSEHOLD_CATEGORIES = ["food", "household", "electronics", "multimedia", "streaming", "gaming", "digital", "other"] as const;
export type HouseholdCategory = (typeof HOUSEHOLD_CATEGORIES)[number];

export interface HouseholdPlan { totalCents: number; allocations: Partial<Record<HouseholdCategory, number>> }

export interface PlanCheck {
  allocatedCents: number;
  unallocatedCents: number;
  overAllocated: boolean;
  perCategory: { category: HouseholdCategory; allocatedCents: number; spentCents: number; remainingCents: number; level: "ok" | "warn" | "over" }[];
}

/** Abgleich Planung ↔ Ausgaben im Monat. `spent` enthält bezahlte Käufe und monatliche Abo-Kosten je Kategorie. */
export function checkPlan(plan: HouseholdPlan, spent: Partial<Record<HouseholdCategory, number>>, warnAtPercent = 80): PlanCheck {
  const allocatedCents = sumCents(HOUSEHOLD_CATEGORIES.map((c) => plan.allocations[c] ?? 0));
  return {
    allocatedCents,
    unallocatedCents: plan.totalCents - allocatedCents,
    overAllocated: allocatedCents > plan.totalCents,
    perCategory: HOUSEHOLD_CATEGORIES.filter((c) => (plan.allocations[c] ?? 0) > 0 || (spent[c] ?? 0) > 0).map((c) => {
      const a = plan.allocations[c] ?? 0;
      const s = spent[c] ?? 0;
      const level = s > a ? "over" : a > 0 && (s / a) * 100 >= warnAtPercent ? "warn" : "ok";
      return { category: c, allocatedCents: a, spentCents: s, remainingCents: a - s, level };
    }),
  };
}

export interface SavingsGoal { id: string; name: string; targetCents: number; savedCents: number; monthlyCents: number; createdAt: string }

/** Wann ist das Ziel bei gleichbleibender Sparrate erreicht? Ohne Sparrate: nicht berechenbar. */
export function goalProjection(g: SavingsGoal, today = new Date()): { reached: boolean; months: number | null; date: string | null; percent: number } {
  const percent = g.targetCents > 0 ? Math.min(100, (g.savedCents / g.targetCents) * 100) : 0;
  if (g.savedCents >= g.targetCents) return { reached: true, months: 0, date: today.toISOString().slice(0, 10), percent: 100 };
  if (g.monthlyCents <= 0) return { reached: false, months: null, date: null, percent };
  const months = Math.ceil((g.targetCents - g.savedCents) / g.monthlyCents);
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + months, 1));
  return { reached: false, months, date: d.toISOString().slice(0, 7), percent };
}
