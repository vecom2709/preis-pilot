import type { QualityResult } from "./price-quality";
import type { PriceObservation } from "./sources/types";

export type RatedObservation = PriceObservation & { quality: QualityResult };
export interface PricesResponse { country: string; fetchedAt: string; observations: RatedObservation[] }
export type OfferObservation = PriceObservation & { status: "current" | "expired" | "documented" | "not_offer"; ageDays: number };
export interface OffersResponse { country: string; fetchedAt: string; offers: OfferObservation[] }

export interface ProductSummary {
  code: string;
  name: string | null;
  brand: string | null;
  quantityText: string | null;
  packageBase: number | null;
  packageDimension: "mass" | "volume" | "count" | null;
}

/** Jüngste verwendbare Beobachtung je Geschäft (Standort) */
export function latestPerStore(obs: readonly RatedObservation[]): RatedObservation[] {
  const map = new Map<string, RatedObservation>();
  for (const o of obs) {
    if (!o.quality.usable || o.pricePer !== "item") continue;
    const key = String(o.store.locationId ?? o.store.name);
    const prev = map.get(key);
    if (!prev || o.date > prev.date || (o.date === prev.date && o.recordedAt > prev.recordedAt)) map.set(key, o);
  }
  return [...map.values()].sort((a, b) => a.priceCents - b.priceCents || b.date.localeCompare(a.date));
}
