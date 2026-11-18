// Datenmodell der Angebots-Engine. Bewusst ohne Next-spezifische Importe, damit es auch in der
// geplanten Netlify-Funktion und im lokalen Aktualisierungsskript läuft.
import { z } from "zod";

export const COUNTRIES = ["DE", "IT"] as const;
export type DealCountry = (typeof COUNTRIES)[number];

/**
 * Bezugsgrößen für Rabatte, streng getrennt (PAngV § 11 / Richtlinie 98/6/EG Art. 6a):
 * - rrp: unverbindliche Preisempfehlung des Herstellers
 * - merchant_previous: vom Händler angegebener vorheriger Preis
 * - lowest30: niedrigster eigener Beobachtungspreis desselben Händlers in den 30 Tagen davor
 * - market: eigenständig ermittelter Marktvergleich (Median anderer Händler, gleiche GTIN)
 */
export const ReferenceSchema = z.object({
  kind: z.enum(["rrp", "merchant_previous", "lowest30", "market"]),
  cents: z.number().int().positive(),
});
export type Reference = z.infer<typeof ReferenceSchema>;

export const DealSchema = z.object({
  id: z.string().min(3).max(160),
  source: z.string().min(2).max(40),
  merchant: z.string().min(1).max(80),
  country: z.enum(COUNTRIES),
  category: z.string().min(2).max(40),
  subcategory: z.string().max(60).nullable(),
  title: z.string().min(2).max(200),
  brand: z.string().max(80).nullable(),
  gtin: z.string().regex(/^\d{8,14}$/).nullable(),
  image: z.string().url().nullable(),
  url: z.string().url(),
  /** Anzeige-/Affiliate-Link → wird sichtbar gekennzeichnet */
  affiliate: z.boolean(),
  priceCents: z.number().int().nonnegative(),
  /** null = unbekannt; Filialpreise haben keinen Versand (delivery = store) */
  shippingCents: z.number().int().nonnegative().nullable(),
  delivery: z.enum(["online", "digital", "store"]),
  condition: z.enum(["new", "used", "refurbished", "bware", "digital"]),
  availability: z.enum(["in_stock", "limited", "out_of_stock", "unknown"]),
  references: z.array(ReferenceSchema).max(4),
  coupon: z.string().max(80).nullable(),
  validUntil: z.string().nullable(),
  /** Zeitpunkt der letzten Prüfung bei der Quelle */
  observedAt: z.string(),
  firstSeen: z.string(),
  /** z. B. „Filiale Berlin“, Plattform/DRM bei Spielen, Grundpreis */
  note: z.string().max(160).nullable(),
  sellerRating: z.number().min(0).max(100).nullable(),
});
export type Deal = z.infer<typeof DealSchema>;

/** Rohangebot, wie ein Connector es liefert (ohne Zeitstempel der Engine) */
export type RawDeal = Omit<Deal, "firstSeen">;

export interface ScoreReason { code: string; points: number; params?: Record<string, string | number> }

export interface ScoredDeal extends Deal {
  totalCents: number | null;
  /** gewählte, belastbarste Bezugsgröße für die Rabattanzeige */
  basis: Reference | null;
  discountPercent: number | null;
  savingCents: number | null;
  score: number;
  reasons: ScoreReason[];
  cheaperElsewhere: { merchant: string; totalCents: number } | null;
  priceDropAt: string | null;
}

export interface HistoryMap { [dealId: string]: [string, number][] }

export interface SourceRun {
  source: string;
  country: DealCountry;
  ok: boolean;
  fetched: number;
  rejected: number;
  error: string | null;
  attempts: number;
  ms: number;
}

export interface RunLog {
  id: string;
  trigger: "zeitplan" | "admin" | "lokal" | "erstlauf" | "test";
  startedAt: string;
  finishedAt: string;
  sources: SourceRun[];
  added: number;
  removed: number;
  updated: number;
  total: number;
}

export interface AdminConfig {
  disabledSources: string[];
  disabledMerchants: string[];
  intervals: Record<string, number>;
}
