// Summen von Einkaufslisten – fehlende Preise werden nie geschätzt, sondern ausgewiesen.
import { multiplyCents, sumCents } from "./money";

export interface PricedLine {
  id: string;
  quantity: number;
  /** Preis je Packung/Stück in Cent, null = unbekannt */
  priceCents: number | null;
  checked?: boolean;
}

export interface ListTotals {
  /** Summe aller Positionen mit bekanntem Preis */
  confirmedCents: number;
  /** Summe der bereits abgehakten Positionen mit bekanntem Preis */
  checkedCents: number;
  pricedCount: number;
  missingCount: number;
  missingIds: string[];
  /** true, wenn jede Position einen Preis hat – erst dann ist die Summe vollständig */
  complete: boolean;
}

export function computeListTotals(lines: readonly PricedLine[]): ListTotals {
  const priced = lines.filter((l) => l.priceCents !== null && l.quantity > 0);
  const missing = lines.filter((l) => l.priceCents === null);
  const lineTotal = (l: PricedLine) => multiplyCents(l.priceCents!, l.quantity);
  return {
    confirmedCents: sumCents(priced.map(lineTotal)),
    checkedCents: sumCents(priced.filter((l) => l.checked).map(lineTotal)),
    pricedCount: priced.length,
    missingCount: missing.length,
    missingIds: missing.map((l) => l.id),
    complete: lines.length > 0 && missing.length === 0,
  };
}
