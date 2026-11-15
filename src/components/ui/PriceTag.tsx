import type { ReactNode } from "react";

// Das Regaletikett ist das Leitmotiv von Preis-Pilot: großer Preis, Grundpreis, darunter Herkunft und Datum.
// Ohne bekannten Preis bleibt das Etikett leer und gestrichelt – nichts wird geschätzt.

interface PriceTagProps {
  price: string | null;
  unitPrice?: string | null;
  store?: ReactNode;
  footer?: ReactNode;
  badge?: ReactNode;
  emptyLabel: string;
  size?: "md" | "lg";
  highlight?: boolean;
}

export function PriceTag({ price, unitPrice, store, footer, badge, emptyLabel, size = "md", highlight = false }: PriceTagProps) {
  if (price === null) {
    return (
      <div className="flex min-h-[7.5rem] flex-col justify-between rounded-[var(--radius-tag)] border-2 border-dashed border-line bg-paper p-3">
        {store && <div className="text-sm font-semibold text-ink-soft">{store}</div>}
        <p className="text-[0.95rem] font-semibold text-slate">{emptyLabel}</p>
      </div>
    );
  }
  return (
    <div
      className={`overflow-hidden rounded-[var(--radius-tag)] border bg-paper ${
        highlight ? "border-pine shadow-[inset_0_0_0_1px_var(--pine)]" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-2 px-3 pt-2.5">
        <div className="min-w-0 text-sm font-semibold text-ink-soft">{store}</div>
        {badge}
      </div>
      <div className="px-3 pb-2.5 pt-1">
        <div className={`price text-ink ${size === "lg" ? "text-[3.1rem]" : "text-[2.2rem]"}`}>{price}</div>
        {unitPrice && <div className="num mt-1 text-[0.85rem] text-ink-soft">{unitPrice}</div>}
      </div>
      {footer && <div className="border-t border-line bg-mist px-3 py-1.5 text-[0.78rem] text-ink-soft">{footer}</div>}
    </div>
  );
}
