import { formatCents, formatUnitPrice } from "./money";
import { referenceUnit, unitPrice, type Dimension } from "./units";
import type { Dictionary } from "@/i18n/dictionaries/de";

export function formatDate(iso: string, intl: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  return new Intl.DateTimeFormat(intl, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(d);
}

export function formatMonth(yyyyMm: string, intl: string): string {
  return new Intl.DateTimeFormat(intl, { month: "short", timeZone: "UTC" }).format(new Date(`${yyyyMm}-15T12:00:00Z`));
}

export function relativeDays(iso: string, t: Dictionary, now = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(`${iso.slice(0, 10)}T12:00:00Z`).getTime()) / 86_400_000);
  if (days <= 0) return t.common.today;
  if (days === 1) return t.common.yesterday;
  return t.common.daysAgo.replace("{n}", String(days));
}

export function unitLabel(dim: Dimension, t: Dictionary): string {
  const u = referenceUnit(dim).label;
  return u === "kg" ? t.common.perKg : u === "l" ? t.common.perL : t.common.perPiece;
}

/** "4,98 € pro kg" – oder null, wenn die Packungsgröße unbekannt ist */
export function formatGrundpreis(
  priceCents: number,
  base: number | null,
  dim: Dimension | null,
  intl: string,
  t: Dictionary,
): string | null {
  if (!base || !dim) return null;
  const up = unitPrice(priceCents, { base, dimension: dim });
  return up === null ? null : `${formatUnitPrice(up, intl)} ${unitLabel(dim, t)}`;
}

export { formatCents };
