// Geldbeträge werden ausschließlich als ganze Cent (Integer) gespeichert und verrechnet.
// So entstehen keine Rundungsfehler durch Gleitkommazahlen.

export type Cents = number;

/** Wandelt Eingaben wie "2,49", "2.49", "1.234,50" oder 2.49 in Cent um. Ungültig → null. */
export function toCents(input: string | number | null | undefined): Cents | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") {
    if (!Number.isFinite(input)) return null;
    // toFixed beseitigt Darstellungsfehler wie 1.005 * 100 = 100.49999…
    return Math.round(Number((input * 100).toFixed(6)));
  }
  let s = input.trim().replace(/\s|€|eur/gi, "");
  if (!s) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // Das zuletzt stehende Trennzeichen ist das Dezimaltrennzeichen.
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma > -1) {
    s = s.replace(",", ".");
  }
  if (!/^-?\d+(\.\d{1,2})?$/.test(s)) return null;
  const negative = s.startsWith("-");
  const [whole, frac = ""] = s.replace("-", "").split(".");
  const cents = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  return negative ? -cents : cents;
}

export function sumCents(values: readonly Cents[]): Cents {
  return values.reduce((a, b) => a + b, 0);
}

/** Multipliziert einen Centbetrag mit einer Menge und rundet kaufmännisch auf ganze Cent. */
export function multiplyCents(cents: Cents, factor: number): Cents {
  return Math.round(cents * factor);
}

export function formatCents(cents: Cents, locale: string, currency = "EUR"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}

/** Für Grundpreise: Bruchteile von Cent bleiben bis zur Anzeige erhalten. */
export function formatUnitPrice(centsPerUnit: number, locale: string, currency = "EUR"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centsPerUnit / 100);
}
