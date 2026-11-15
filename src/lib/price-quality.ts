// Preisqualitätsprüfung: veraltete, doppelte, unplausible und verdächtige Einträge erkennen.
import type { PriceObservation } from "./sources/types";

export type QualityFlag = "stale" | "outdated" | "duplicate" | "implausible" | "outlier" | "future";

export interface QualityResult {
  flags: QualityFlag[];
  /** Darf der Eintrag für Vergleiche, Summen und Alarme genutzt werden? */
  usable: boolean;
  ageDays: number;
}

export const QUALITY_RULES = {
  /** ab diesem Alter wird ein Preis als „älter“ markiert */
  staleAfterDays: 90,
  /** ab diesem Alter fließt ein Preis nicht mehr in Vergleiche ein */
  outdatedAfterDays: 365,
  minCents: 1,
  maxCents: 100_000,
  /** Abweichung vom Median gleicher Produkt-Beobachtungen, ab der ein Ausreißer vorliegt */
  outlierFactor: 3,
} as const;

export function daysBetween(fromIso: string, to: Date): number {
  const from = new Date(`${fromIso.slice(0, 10)}T00:00:00Z`).getTime();
  const end = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.floor((end - from) / 86_400_000);
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function fingerprint(o: PriceObservation): string {
  return [o.productCode ?? o.productName, o.store.locationId ?? o.store.name, o.date, o.priceCents, o.pricePer].join("|");
}

/** Bewertet eine Liste von Beobachtungen gemeinsam (für Duplikat- und Ausreißererkennung). */
export function assessObservations(
  observations: readonly PriceObservation[],
  now: Date = new Date(),
): Map<string, QualityResult> {
  const result = new Map<string, QualityResult>();
  const seen = new Set<string>();
  const byProduct = new Map<string, number[]>();
  for (const o of observations) {
    if (o.productCode && o.pricePer === "item") {
      byProduct.set(o.productCode, [...(byProduct.get(o.productCode) ?? []), o.priceCents]);
    }
  }
  for (const o of observations) {
    const flags: QualityFlag[] = [];
    const ageDays = daysBetween(o.date, now);
    if (ageDays < 0) flags.push("future");
    if (ageDays > QUALITY_RULES.outdatedAfterDays) flags.push("outdated");
    else if (ageDays > QUALITY_RULES.staleAfterDays) flags.push("stale");
    if (o.priceCents < QUALITY_RULES.minCents || o.priceCents > QUALITY_RULES.maxCents) flags.push("implausible");
    const fp = fingerprint(o);
    if (o.duplicateOf || seen.has(fp)) flags.push("duplicate");
    seen.add(fp);
    const peers = o.productCode ? byProduct.get(o.productCode) : undefined;
    if (peers && peers.length >= 3) {
      const m = median(peers);
      if (m > 0 && (o.priceCents > m * QUALITY_RULES.outlierFactor || o.priceCents < m / QUALITY_RULES.outlierFactor)) {
        flags.push("outlier");
      }
    }
    const blocking: QualityFlag[] = ["outdated", "duplicate", "implausible", "outlier", "future"];
    result.set(o.id, { flags, usable: !flags.some((f) => blocking.includes(f)), ageDays });
  }
  return result;
}

export function usableObservations(observations: readonly PriceObservation[], now = new Date()): PriceObservation[] {
  const q = assessObservations(observations, now);
  return observations.filter((o) => q.get(o.id)?.usable);
}

/**
 * Ein Angebot gilt nur dann als aktuell, wenn seine Gültigkeit belegt ist und heute einschließt.
 * Open Prices liefert keine Laufzeiten – solche Angebote sind „dokumentiert“, nie „aktuell“.
 */
export function offerStatus(o: PriceObservation, now = new Date()): "current" | "expired" | "documented" | "not_offer" {
  if (!o.isDiscounted) return "not_offer";
  if (!o.validFrom || !o.validUntil) return "documented";
  const today = now.toISOString().slice(0, 10);
  if (o.validFrom <= today && today <= o.validUntil) return "current";
  return "expired";
}
