// Mengen, Packungsgrößen und Grundpreise (Preis pro kg, Liter oder Stück).

export type Dimension = "mass" | "volume" | "count";
export type BaseUnit = "g" | "ml" | "piece";

export interface Quantity {
  /** Menge in Basiseinheit: Gramm, Milliliter oder Stück */
  base: number;
  dimension: Dimension;
}

const UNIT_TABLE: Record<string, { factor: number; dimension: Dimension }> = {
  mg: { factor: 0.001, dimension: "mass" },
  g: { factor: 1, dimension: "mass" },
  gr: { factor: 1, dimension: "mass" },
  kg: { factor: 1000, dimension: "mass" },
  ml: { factor: 1, dimension: "volume" },
  cl: { factor: 10, dimension: "volume" },
  dl: { factor: 100, dimension: "volume" },
  l: { factor: 1000, dimension: "volume" },
  lt: { factor: 1000, dimension: "volume" },
  stk: { factor: 1, dimension: "count" },
  "stück": { factor: 1, dimension: "count" },
  pz: { factor: 1, dimension: "count" },
  pezzi: { factor: 1, dimension: "count" },
  piece: { factor: 1, dimension: "count" },
  pieces: { factor: 1, dimension: "count" },
  pcs: { factor: 1, dimension: "count" },
};

export function normalizeUnit(unit: string): { factor: number; dimension: Dimension } | null {
  return UNIT_TABLE[unit.trim().toLowerCase().replace(/\.$/, "")] ?? null;
}

export function toQuantity(value: number, unit: string): Quantity | null {
  const u = normalizeUnit(unit);
  if (!u || !Number.isFinite(value) || value <= 0) return null;
  return { base: value * u.factor, dimension: u.dimension };
}

/**
 * Liest Packungsangaben wie "500 g", "1,5 l", "6 x 1,5 l", "4x125g", "10 Stück".
 * Liefert null, wenn die Angabe nicht eindeutig ist – dann wird nichts geraten.
 */
export function parseQuantity(text: string | null | undefined): Quantity | null {
  if (!text) return null;
  const s = text.toLowerCase().replace(/,/g, ".").replace(/\s+/g, " ").trim();
  const multi = s.match(/^(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*([a-zäöüß]+)\.?$/);
  if (multi) {
    const q = toQuantity(Number(multi[2]), multi[3]);
    return q ? { ...q, base: q.base * Number(multi[1]) } : null;
  }
  const single = s.match(/^(\d+(?:\.\d+)?)\s*([a-zäöüß]+)\.?$/);
  if (single) return toQuantity(Number(single[1]), single[2]);
  return null;
}

export function referenceUnit(dimension: Dimension): { amount: number; label: "kg" | "l" | "piece" } {
  if (dimension === "mass") return { amount: 1000, label: "kg" };
  if (dimension === "volume") return { amount: 1000, label: "l" };
  return { amount: 1, label: "piece" };
}

/** Grundpreis in Cent pro kg / l / Stück (ungerundet, Rundung erst bei der Anzeige). */
export function unitPrice(priceCents: number, qty: Quantity | null): number | null {
  if (!qty || qty.base <= 0 || priceCents < 0) return null;
  return (priceCents * referenceUnit(qty.dimension).amount) / qty.base;
}

export interface PackOption {
  id: string;
  priceCents: number;
  quantity: Quantity | null;
}

export type PackComparison =
  | { comparable: false; reason: "missing_quantity" | "different_dimension" | "too_few" }
  | {
      comparable: true;
      dimension: Dimension;
      ranked: { id: string; unitPrice: number }[];
      cheapestId: string;
      /** Ersparnis des günstigsten gegenüber dem teuersten Grundpreis in Prozent */
      spreadPercent: number;
    };

/** Vergleicht Packungsgrößen nur, wenn alle Angaben vorhanden und gleichartig sind. */
export function comparePacks(options: readonly PackOption[]): PackComparison {
  if (options.length < 2) return { comparable: false, reason: "too_few" };
  if (options.some((o) => !o.quantity)) return { comparable: false, reason: "missing_quantity" };
  const dim = options[0].quantity!.dimension;
  if (options.some((o) => o.quantity!.dimension !== dim)) return { comparable: false, reason: "different_dimension" };
  const ranked = options
    .map((o) => ({ id: o.id, unitPrice: unitPrice(o.priceCents, o.quantity)! }))
    .sort((a, b) => a.unitPrice - b.unitPrice);
  const max = ranked[ranked.length - 1].unitPrice;
  const spreadPercent = max > 0 ? ((max - ranked[0].unitPrice) / max) * 100 : 0;
  return { comparable: true, dimension: dim, ranked, cheapestId: ranked[0].id, spreadPercent };
}

/** Wie viele Packungen werden für einen Bedarf benötigt? (z. B. 2 l Bedarf bei 1-l-Packung → 2) */
export function packsNeeded(need: Quantity, pack: Quantity): number | null {
  if (need.dimension !== pack.dimension || pack.base <= 0) return null;
  return Math.max(1, Math.ceil(need.base / pack.base - 1e-9));
}
