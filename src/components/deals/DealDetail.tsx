"use client";
// Detailseite eines Angebots: großes Bild, Preis mit Bezugsgröße, Score mit allen Gründen, eigener Preisverlauf
// und dasselbe Produkt (gleiche GTIN, gleicher Zustand) bei anderen Händlern.
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { allConnectorLabels } from "@/lib/deals/labels";
import { findDealCategory } from "@/lib/deals/categories";
import type { ScoredDeal } from "@/lib/deals/types";
import { useJson } from "@/lib/use-json";
import { Notice } from "@/components/ui/Notice";
import { AddToCart } from "@/components/cart/Cart";
import { IconExternal } from "@/components/ui/icons";
import { DealImage, PriceBlock, ScoreBadge, WatchForm, useAgo } from "./DealCard";

function HistoryChart({ rows, label }: { rows: [string, number][]; label: string }) {
  const { intl } = useI18n();
  const W = 600, H = 170, P = 28;
  const vals = rows.map(([, c]) => c);
  const lo = Math.min(...vals), hi = Math.max(...vals), pad = Math.max(1, (hi - lo) * 0.2);
  const x = (i: number) => P + (rows.length === 1 ? (W - 2 * P) / 2 : (i / (rows.length - 1)) * (W - 2 * P));
  const y = (c: number) => H - P - ((c - (lo - pad)) / (hi + pad - (lo - pad))) * (H - 2 * P);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
      <path d={rows.map(([, c], i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(c).toFixed(1)}`).join(" ")} fill="none" stroke="var(--pine)" strokeWidth="2.5" />
      {rows.map(([day, c], i) => <circle key={day} cx={x(i)} cy={y(c)} r="3.5" fill="var(--paper)" stroke="var(--pine)" strokeWidth="2"><title>{`${day}: ${formatCents(c, intl)}`}</title></circle>)}
      <text x={P} y={H - 6} fontSize="12" fill="var(--ink-soft)">{rows[0][0]}</text>
      <text x={W - P} y={H - 6} fontSize="12" textAnchor="end" fill="var(--ink-soft)">{rows[rows.length - 1][0]}</text>
      <text x={W - P} y={16} fontSize="12" textAnchor="end" fill="var(--ink-soft)">{formatCents(hi, intl)} / {formatCents(lo, intl)}</text>
    </svg>
  );
}

export function DealDetail() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const country = params.get("country") === "IT" ? "IT" : "DE";
  const { t, locale, intl } = useI18n();
  const ago = useAgo();
  const { status, data } = useJson<{ deal: ScoredDeal | null; history: [string, number][]; others: ScoredDeal[] }>(id ? `/api/deals/item?id=${encodeURIComponent(id)}&country=${country}` : null);
  const D = t.deals.detail;
  if (status !== "ok" && status !== "error") return <div className="h-96 animate-pulse rounded-2xl bg-mist-strong" />;
  const d = data?.deal;
  if (!d) return <Notice tone="warn" action={<Link href={`/${locale}/offers`} className="btn btn-quiet btn-sm">{t.deals.finder.title}</Link>}>{D.notFound}</Notice>;
  const cat = findDealCategory(d.category);
  const money = (c: number) => formatCents(c, intl);

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-white">
          <DealImage deal={d} sizes="(min-width: 1024px) 45vw, 100vw" />
        </div>
        <div className="space-y-4">
          <p className="text-sm font-semibold text-pine">
            {d.merchant} · {t.deals.condition[d.condition]}
            {cat && <> · <Link href={`/${locale}/offers/${cat.slug}`} className="underline-offset-4 hover:underline">{cat.label[locale]}</Link></>}
          </p>
          <h1 className="display text-[1.9rem] leading-tight sm:text-[2.3rem]">{d.title}</h1>
          {d.brand && <p className="-mt-2 text-ink-soft">{d.brand}</p>}
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1"><PriceBlock d={d} large /></div>
            <ScoreBadge score={d.score} large />
          </div>
          {d.affiliate && <p className="text-sm text-ink-soft"><span className="rounded bg-ink/80 px-1.5 py-0.5 text-xs font-bold text-white">{t.deals.ad}</span> {t.deals.adNote}</p>}
          <p className="text-sm text-ink-soft">
            {t.deals.availability[d.availability]} · {d.delivery === "store" ? fmt(t.deals.observed, { date: formatDate(d.observedAt.slice(0, 10), intl) }) : fmt(t.deals.checked, { ago: ago(d.observedAt) })}
            {d.validUntil && ` · ${fmt(t.deals.validUntil, { date: formatDate(d.validUntil.slice(0, 10), intl) })}`}
            {` · ${fmt(D.firstSeen, { date: formatDate(d.firstSeen.slice(0, 10), intl) })}`}
          </p>
          {d.note && <p className="text-sm text-ink-soft">{d.note}</p>}
          <div className="flex flex-wrap gap-2">
            <a href={d.url} target="_blank" rel={`noopener noreferrer nofollow${d.affiliate ? " sponsored" : ""}`} className="btn btn-primary">
              {d.delivery === "store" ? t.deals.proof : t.deals.toOffer}<IconExternal width={16} height={16} />
            </a>
            <AddToCart item={{ kind: "deal", ref: d.id, name: d.title.slice(0, 120), detail: d.merchant, rubric: cat?.rubric ?? null, image: d.image, priceCents: d.totalCents ?? d.priceCents, priceSource: d.source === "open-prices" ? "open_prices" : "deal", priceStore: d.merchant, priceDate: d.observedAt }} />
          </div>
          <div className="max-w-sm"><WatchForm deal={d} /></div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-ink-soft">{D.source}</dt><dd>{allConnectorLabels[d.source.split(":")[0]] ?? d.source}</dd>
            {d.gtin && <><dt className="text-ink-soft">{D.gtin}</dt><dd className="num">{d.gtin}</dd></>}
          </dl>
        </div>
      </div>

      <section aria-labelledby="why-title" className="panel p-5">
        <h2 id="why-title" className="text-lg font-bold">{t.deals.why}</h2>
        <ul className="mt-2 space-y-1">
          {d.reasons.map((r) => (
            <li key={r.code} className="flex justify-between gap-3">
              <span>{fmt((t.deals.reasons as Record<string, string>)[r.code] ?? r.code, r.params ?? {})}</span>
              <span className={`num font-semibold ${r.points > 0 ? "text-saving" : r.points < 0 ? "text-danger" : "text-ink-soft"}`}>{r.points > 0 ? `+${r.points}` : r.points}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="hist-title" className="panel p-5">
          <h2 id="hist-title" className="mb-2 text-lg font-bold">{D.history}</h2>
          {data.history.length >= 2 ? <HistoryChart rows={data.history} label={D.history} /> : <p className="text-ink-soft">{D.noHistory}</p>}
        </section>
        <section aria-labelledby="oth-title" className="panel p-5">
          <h2 id="oth-title" className="mb-2 text-lg font-bold">{D.others}</h2>
          {data.others.length ? (
            <ul className="divide-y divide-line">
              {data.others.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/${locale}/deal?id=${encodeURIComponent(o.id)}&country=${o.country}`} className="min-w-0 truncate font-semibold hover:text-pine">{o.merchant}</Link>
                  <span className="num">{o.totalCents !== null ? money(o.totalCents) : `${money(o.priceCents)} + ?`}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-ink-soft">{D.noOthers}</p>}
        </section>
      </div>
    </div>
  );
}
