"use client";
// Top-Angebote einer Rubrik aus selbst erfassten Händlerangeboten: nur Neuware, nur bekannte Gesamtpreise,
// je Händler die jüngste Beobachtung, mindestens zwei Händler je Produkt. Nichts wird geschätzt.
import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { formatCents } from "@/lib/money";
import { bestOffers } from "@/lib/media/engine";
import { findMediaCategory } from "@/lib/media/specs";
import { useAppData, useHydrated } from "@/lib/store/local";
import { AddToCart } from "@/components/cart/Cart";
import { categoryIcons } from "@/components/media/shared";
import { IconScreen } from "@/components/ui/icons";

export function RubricOffers({ categories, rubric, limit = 3 }: { categories: string[]; rubric: string; limit?: number }) {
  const { t, locale, intl } = useI18n();
  const data = useAppData();
  const hydrated = useHydrated();
  if (!hydrated) return <div className="h-40 animate-pulse rounded-lg bg-mist-strong" />;

  const rows = data.products
    .filter((p) => categories.includes(p.category))
    .map((p) => {
      const offers = (bestOffers(data.offers.filter((o) => o.productId === p.id)).get("new") ?? [])
        .filter((o) => o.totalCents !== null && o.availability !== "out_of_stock");
      const max = offers.length ? Math.max(...offers.map((o) => o.totalCents!)) : 0;
      const min = offers[0]?.totalCents ?? 0;
      return { p, offers, spread: max ? Math.round(((max - min) / max) * 100) : 0 };
    })
    .filter((r) => r.offers.length >= 2)
    .sort((a, b) => b.spread - a.spread)
    .slice(0, limit);

  if (!rows.length) {
    const first = categories[0];
    return (
      <div className="space-y-3">
        <p className="text-ink-soft">{t.rubrics.empty}</p>
        {first && <Link href={`/${locale}/produkte/c/${first}`} className="btn btn-quiet btn-sm">{t.rubrics.addOffer}</Link>}
      </div>
    );
  }
  return (
    <div>
      <ul className="divide-y divide-line">
        {rows.map(({ p, offers, spread }) => {
          const Icon = categoryIcons[p.category] ?? IconScreen;
          const best = offers[0];
          return (
            <li key={p.id} className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 py-2.5 md:grid-cols-[3rem_minmax(0,9rem)_1fr_auto]">
              <span className="grid h-12 w-12 place-items-center rounded-md bg-mist text-pine"><Icon width={24} height={24} /></span>
              <Link href={`/${locale}/produkte/product?id=${encodeURIComponent(p.id)}`} className="min-w-0 hover:text-pine">
                <span className="block truncate font-bold leading-tight">{p.brand} {p.name}</span>
                <span className="num block truncate text-sm text-ink-soft">{p.model || findMediaCategory(p.category)?.label[locale]}</span>
              </Link>
              <ul className="col-span-2 flex flex-wrap gap-1.5 md:col-span-1 xl:flex-nowrap">
                {offers.slice(0, 3).map((o, i) => (
                  <li key={o.id} className={`flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 ${i === 0 ? "bg-saving/12 ring-1 ring-saving/30" : "bg-mist"}`}>
                    <span className="max-w-[5.6rem] truncate rounded bg-paper px-1.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-ink ring-1 ring-line">{o.merchant}</span>
                    <span className="num whitespace-nowrap text-[0.92rem] font-semibold">{formatCents(o.totalCents!, intl)}</span>
                  </li>
                ))}
              </ul>
              <span className="col-span-2 flex items-center gap-2 justify-self-start md:col-span-1 md:justify-self-end">
                <span className={`rounded-md px-2.5 py-1 text-[1.2rem] font-extrabold leading-none text-white ${spread > 0 ? "bg-saving" : "bg-[#4b5d68]"}`}>{spread > 0 ? `-${spread} %` : "±0 %"}</span>
                <AddToCart compact item={{
                  kind: "product", ref: p.id, name: `${p.brand} ${p.name}`, detail: p.model || null, rubric, image: null,
                  priceCents: best.totalCents, priceSource: "manual", priceStore: best.merchant, priceDate: best.observedAt,
                }} />
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-ink-soft">{t.rubrics.manualNote}</p>
    </div>
  );
}
