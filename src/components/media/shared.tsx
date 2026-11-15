"use client";
// Gemeinsame Bausteine der Multimedia-Welt.
import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { useMediaT } from "@/i18n/media";
import { fmt } from "@/i18n";
import { formatCents } from "@/lib/money";
import { bestOffers, type Condition, type MediaProduct, type Offer, type RankedOffer } from "@/lib/media/engine";
import { specSchemas, type SpecDef } from "@/lib/media/specs";
import { IconScreen } from "@/components/ui/icons";
import { categoryIcons } from "./shared-icons";
import { AddToCart } from "@/components/cart/Cart";
import { rubricOf } from "@/lib/rubrics";

export { categoryIcons };


export function useMedia() {
  const { locale, intl, t: tm } = useI18n();
  const t = useMediaT();
  const money = (c: number) => formatCents(c, intl);
  return { locale, intl, t, tm, money };
}

/** Einheiten der Datenblätter sind deutsch hinterlegt und werden hier übersetzt. */
export function unitLabel(def: SpecDef, units: Record<string, string>): string {
  return def.unit ? (units[def.unit] ?? def.unit) : "";
}

export function specValue(def: SpecDef, value: unknown, t: ReturnType<typeof useMediaT>, intl: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (def.type === "bool") return value === true ? t.product.yes : t.product.no;
  if (def.type === "number" && typeof value === "number") {
    const u = unitLabel(def, t.units);
    return `${new Intl.NumberFormat(intl, { maximumFractionDigits: 2 }).format(value)}${u ? ` ${u}` : ""}`;
  }
  return String(value);
}

export function productTitle(p: Pick<MediaProduct, "brand" | "name">): string {
  return `${p.brand} ${p.name}`;
}

/** Bester Gesamtpreis (Neuware bevorzugt, sonst digital/Abo) – nur bekannte Gesamtpreise. */
export function bestNew(offers: readonly Offer[], productId: string, now = new Date()): RankedOffer | null {
  const groups = bestOffers(offers.filter((o) => o.productId === productId), now);
  for (const c of ["new", "digital", "subscription"] as Condition[]) {
    const first = (groups.get(c) ?? []).find((o) => o.totalCents !== null && o.availability !== "out_of_stock");
    if (first) return first;
  }
  return null;
}

export function ProductRow({ product, offers }: { product: MediaProduct; offers: readonly Offer[] }) {
  const { locale, t, money } = useMedia();
  const best = bestNew(offers, product.id);
  const Icon = categoryIcons[product.category] ?? IconScreen;
  return (
    <li>
      <Link
        href={`/${locale}/produkte/product?id=${encodeURIComponent(product.id)}`}
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-mist-strong"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-pine">
          <Icon width={20} height={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{productTitle(product)}</span>
          <span className="num block truncate text-sm text-ink-soft">{product.model || t.product.unknown}</span>
        </span>
        <span className="text-right">
          {best ? (
            <>
              <span className="price block text-xl">{money(best.totalCents!)}</span>
              <span className="block text-xs text-ink-soft">{best.merchant}</span>
            </>
          ) : (
            <span className="text-sm text-ink-soft">{t.compare.noPrice}</span>
          )}
        </span>
      </Link>
      <AddToCart compact item={{
        kind: "product", ref: product.id, name: productTitle(product), detail: product.model || null, rubric: rubricOf(product.category, "products")?.slug ?? null, image: null,
        priceCents: best?.totalCents ?? null, priceSource: best ? "manual" : null, priceStore: best?.merchant ?? null, priceDate: best?.observedAt ?? null,
      }} />
    </li>
  );
}

export function schemaFor(p: Pick<MediaProduct, "schema">): SpecDef[] {
  return specSchemas[p.schema] ?? [];
}

export function Freshness({ offer }: { offer: RankedOffer }) {
  const { t, intl } = useMedia();
  const date = new Intl.DateTimeFormat(intl, { dateStyle: "medium", timeStyle: "short" }).format(new Date(offer.observedAt));
  return offer.fresh ? (
    <span className="chip bg-pine-tint text-pine-strong" title={date}>{t.offers.fresh}</span>
  ) : (
    <span className="chip border border-line text-ink-soft">{fmt(t.offers.stale, { date })}</span>
  );
}
