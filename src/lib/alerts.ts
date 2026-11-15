// SparRadar: Preisalarme lösen nur bei neuen, nachvollziehbar erfassten Daten aus.
import type { PriceObservation } from "./sources/types";

export interface PriceAlert {
  id: string;
  productCode: string;
  productName: string;
  thresholdCents: number;
  country: string;
  /** ISO-Zeitpunkt der Einrichtung – ältere Beobachtungen lösen keinen Alarm aus */
  createdAt: string;
  /** bereits gemeldete Beobachtungen */
  notifiedIds: string[];
}

export interface AlertMatch {
  alertId: string;
  observation: PriceObservation;
}

/**
 * `observations` müssen vorher die Qualitätsprüfung bestanden haben (usableObservations).
 * Treffer: gleiches Produkt, gleiches Land, EUR, Preis ≤ Grenze, Beobachtung am/nach dem Einrichtungstag,
 * noch nicht gemeldet.
 */
export function evaluateAlerts(alerts: readonly PriceAlert[], observations: readonly PriceObservation[]): AlertMatch[] {
  const matches: AlertMatch[] = [];
  for (const alert of alerts) {
    const since = alert.createdAt.slice(0, 10);
    const hits = observations
      .filter(
        (o) =>
          o.productCode === alert.productCode &&
          o.pricePer === "item" &&
          o.currency === "EUR" &&
          o.store.countryCode === alert.country &&
          o.priceCents <= alert.thresholdCents &&
          o.date >= since &&
          !alert.notifiedIds.includes(o.id),
      )
      .sort((a, b) => a.priceCents - b.priceCents);
    for (const o of hits) matches.push({ alertId: alert.id, observation: o });
  }
  return matches;
}

/** Auffällige Preiserhöhung: jüngster Preis liegt deutlich über dem vorherigen am selben Ort. */
export function detectIncrease(history: readonly PriceObservation[], thresholdPercent = 15): { fromCents: number; toCents: number; percent: number } | null {
  const sorted = [...history].filter((o) => o.pricePer === "item").sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return null;
  const last = sorted[sorted.length - 1];
  const prev = [...sorted].reverse().find((o) => o.id !== last.id && o.store.locationId === last.store.locationId && o.date < last.date);
  if (!prev || prev.priceCents <= 0) return null;
  const percent = ((last.priceCents - prev.priceCents) / prev.priceCents) * 100;
  return percent >= thresholdPercent ? { fromCents: prev.priceCents, toCents: last.priceCents, percent } : null;
}
