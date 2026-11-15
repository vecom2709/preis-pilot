// Prüfung von EAN-8, EAN-13, UPC-A (12) und GTIN-14 über die Prüfziffer.

export function isValidGtin(code: string): boolean {
  if (!/^\d+$/.test(code) || ![8, 12, 13, 14].includes(code.length)) return false;
  const digits = code.split("").map(Number);
  const check = digits.pop()!;
  const sum = digits
    .reverse()
    .reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/** Entfernt Leerzeichen/Bindestriche. UPC-A wird zusätzlich als EAN-13 (führende 0) erkannt. */
export function normalizeBarcode(raw: string): string | null {
  const code = raw.replace(/[\s-]/g, "");
  if (!isValidGtin(code)) return null;
  return code;
}

export function barcodeVariants(code: string): string[] {
  if (code.length === 12) return [code, `0${code}`];
  if (code.length === 13 && code.startsWith("0")) return [code, code.slice(1)];
  return [code];
}
