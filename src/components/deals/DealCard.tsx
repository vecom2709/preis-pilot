"use client";
// Angebotskarte: echtes Bild, Händler, Preis, belegter Vergleichspreis, Ersparnis, Versand, Gesamtpreis,
// Verfügbarkeit, Prüfzeitpunkt, Deal-Score mit Gründen, „Zum Angebot“, Einkaufswagen und Preisalarm.
import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { formatCents, toCents } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { findDealCategory } from "@/lib/deals/categories";
import type { ScoredDeal } from "@/lib/deals/types";
import { uid, updateData, useAppData, useHydrated } from "@/lib/store/local";
import { AddToCart } from "@/components/cart/Cart";
import { IconBell, IconExternal } from "@/components/ui/icons";

const OPTIMIZED = ["images.openfoodfacts.org", "images.gog-statics.com", "shared.akamai.steamstatic.com", "shared.fastly.steamstatic.com", "cdn.akamai.steamstatic.com", "i.ebayimg.com", "assets.isthereanydeal.com"];

export function useAgo() {
  const { t } = useI18n();
  return (iso: string) => {
    const min = Math.max(0, (Date.now() - Date.parse(iso)) / 60000);
    if (min < 2) return t.deals.ago.now;
    if (min < 60) return fmt(t.deals.ago.min, { n: Math.round(min) });
    if (min < 48 * 60) return fmt(t.deals.ago.h, { n: Math.round(min / 60) });
    return fmt(t.deals.ago.d, { n: Math.round(min / 1440) });
  };
}

export function DealImage({ deal, sizes = "(min-width: 1024px) 22vw, 60vw" }: { deal: Pick<ScoredDeal, "image" | "delivery" | "title">; sizes?: string }) {
  const fit = deal.delivery === "digital" ? "object-cover" : "object-contain p-3";
  if (!deal.image) return <span className="grid h-full w-full place-items-center text-sm text-ink-soft">—</span>;
  const host = (() => { try { return new URL(deal.image).hostname; } catch { return ""; } })();
  if (OPTIMIZED.includes(host)) return <Image src={deal.image} alt={deal.title} fill sizes={sizes} className={fit} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={deal.image} alt={deal.title} loading="lazy" decoding="async" className={`absolute inset-0 h-full w-full ${fit}`} />;
}

export function ScoreBadge({ score, large = false }: { score: number; large?: boolean }) {
  const { t } = useI18n();
  const tone = score >= 75 ? "bg-saving text-white" : score >= 50 ? "bg-[#0d5560] text-white" : "bg-[#4b5d68] text-white";
  return (
    <span className={`inline-flex flex-col items-center justify-center rounded-xl leading-none ${tone} ${large ? "h-16 w-16" : "h-12 w-12"}`} title={t.deals.score}>
      <span className={`num font-extrabold ${large ? "text-2xl" : "text-lg"}`}>{score}</span>
      <span className="text-[0.6rem] font-bold uppercase tracking-wide">Score</span>
    </span>
  );
}

export function PriceBlock({ d, large = false }: { d: ScoredDeal; large?: boolean }) {
  const { t, intl } = useI18n();
  const money = (c: number) => formatCents(c, intl);
  const ship =
    d.delivery === "store" ? t.deals.storePrice
    : d.delivery === "digital" ? t.deals.digital
    : d.shippingCents === 0 ? t.deals.shippingFree
    : d.shippingCents === null ? t.deals.shippingUnknown
    : fmt(t.deals.shipping, { amount: money(d.shippingCents) });
  return (
    <div>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className={`price ${large ? "text-4xl" : "text-[1.7rem]"}`}>{money(d.priceCents)}</span>
        {d.basis && (
          <span className="text-sm text-ink-soft">
            {fmt(t.deals.instead, { price: "" })}<del className="num">{money(d.basis.cents)}</del>
          </span>
        )}
      </p>
      {d.basis && <p className="text-[0.75rem] leading-snug text-ink-soft">{t.deals.basis[d.basis.kind]}</p>}
      {d.savingCents !== null && d.savingCents > 0 && <p className="text-sm font-semibold text-saving">{fmt(t.deals.saving, { amount: money(d.savingCents) })}</p>}
      <p className="mt-0.5 text-[0.82rem] text-ink-soft">
        {ship}
        {d.delivery === "online" && " · "}
        {d.delivery === "online" && (d.totalCents !== null ? <strong className="font-semibold text-ink">{fmt(t.deals.total, { amount: money(d.totalCents) })}</strong> : t.deals.totalUnknown)}
      </p>
    </div>
  );
}

export function WatchForm({ deal, onDone }: { deal: ScoredDeal; onDone?: () => void }) {
  const { t } = useI18n();
  const [err, setErr] = useState(false);
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cents = toCents(String(new FormData(e.currentTarget).get("target") ?? ""));
    if (!cents) return setErr(true);
    updateData((d) => ({
      ...d,
      dealWatches: [
        ...d.dealWatches.filter((w) => w.dealId !== deal.id),
        { id: uid(), dealId: deal.id, country: deal.country, title: deal.title, merchant: deal.merchant, image: deal.image, gtin: deal.gtin, targetCents: cents, lastCents: deal.totalCents ?? deal.priceCents, lastCheck: new Date().toISOString(), hitAt: (deal.totalCents ?? deal.priceCents) <= cents ? new Date().toISOString() : null, expired: false, seen: false, createdAt: new Date().toISOString() },
      ],
    }));
    onDone?.();
  }
  return (
    <form onSubmit={save} className="flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <label className="label !text-xs" htmlFor={`w-${deal.id}`}>{t.deals.alarmTarget}</label>
        <input id={`w-${deal.id}`} name="target" required inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,2})?" aria-invalid={err} className="field num !h-10" />
      </div>
      <button type="submit" className="btn btn-primary btn-sm !h-10">{t.deals.alarmSave}</button>
    </form>
  );
}

export function DealCard({ deal: d }: { deal: ScoredDeal }) {
  const { t, locale, intl } = useI18n();
  const ago = useAgo();
  const data = useAppData();
  const hydrated = useHydrated();
  const [watching, setWatching] = useState(false);
  const watch = hydrated ? data.dealWatches.find((w) => w.dealId === d.id) : undefined;
  const money = (c: number) => formatCents(c, intl);
  const suspect = d.reasons.find((r) => r.code === "price_error_suspect");
  const cat = findDealCategory(d.category);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_10px_28px_-20px_rgba(11,58,69,0.55)] transition-shadow hover:shadow-[0_16px_36px_-18px_rgba(11,58,69,0.55)]">
      <Link href={`/${locale}/deal?id=${encodeURIComponent(d.id)}&country=${d.country}`} className="relative block aspect-[4/3] bg-white" aria-label={`${t.deals.details}: ${d.title}`}>
        <DealImage deal={d} />
        <span className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
          {d.discountPercent !== null && d.discountPercent > 0 && <span className="rounded-md bg-saving px-2 py-1 text-[1rem] font-extrabold leading-none text-white">-{d.discountPercent} %</span>}
          {d.affiliate && <span className="rounded bg-ink/80 px-1.5 py-0.5 text-[0.68rem] font-bold text-white" title={t.deals.adNote}>{t.deals.ad}</span>}
        </span>
        <span className="absolute right-2.5 top-2.5"><ScoreBadge score={d.score} /></span>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <p className="flex flex-wrap items-center gap-x-2 text-[0.8rem] font-semibold text-pine">
          <span className="truncate">{d.merchant}</span>
          <span className="font-normal text-ink-soft">· {t.deals.condition[d.condition]}</span>
          {cat && <span className="truncate font-normal text-ink-soft">· {cat.label[locale]}</span>}
        </p>
        <h3 className="line-clamp-2 text-[1.02rem] font-bold leading-snug">
          <Link href={`/${locale}/deal?id=${encodeURIComponent(d.id)}&country=${d.country}`} className="hover:text-pine">{d.title}</Link>
        </h3>
        {d.brand && <p className="-mt-1.5 truncate text-[0.8rem] text-ink-soft">{d.brand}</p>}
        <PriceBlock d={d} />
        {d.cheaperElsewhere && <p className="rounded-md bg-saffron-tint px-2 py-1 text-[0.8rem] text-saffron-text">{fmt(t.deals.cheaper, { merchant: d.cheaperElsewhere.merchant, price: money(d.cheaperElsewhere.totalCents) })}</p>}
        {suspect && <p className="rounded-md border border-saffron/60 px-2 py-1 text-[0.8rem] font-semibold text-saffron-text">{t.deals.suspect}</p>}
        <p className="text-[0.75rem] text-ink-soft">
          {t.deals.availability[d.availability]} · {d.delivery === "store" ? fmt(t.deals.observed, { date: formatDate(d.observedAt.slice(0, 10), intl) }) : fmt(t.deals.checked, { ago: ago(d.observedAt) })}
          {d.validUntil && ` · ${fmt(t.deals.validUntil, { date: formatDate(d.validUntil.slice(0, 10), intl) })}`}
        </p>
        {d.note && <p className="text-[0.75rem] text-ink-soft">{d.note}</p>}
        <details className="text-[0.8rem]">
          <summary className="cursor-pointer font-semibold text-pine">{t.deals.why}</summary>
          <ul className="mt-1.5 space-y-0.5">
            {d.reasons.map((r) => (
              <li key={r.code} className="flex justify-between gap-2">
                <span>{fmt((t.deals.reasons as Record<string, string>)[r.code] ?? r.code, r.params ?? {})}</span>
                <span className={`num shrink-0 font-semibold ${r.points > 0 ? "text-saving" : r.points < 0 ? "text-danger" : "text-ink-soft"}`}>{r.points > 0 ? `+${r.points}` : r.points}</span>
              </li>
            ))}
          </ul>
        </details>
        <div className="mt-auto flex items-center gap-2 pt-1">
          <a
            href={d.url}
            target="_blank"
            rel={`noopener noreferrer nofollow${d.affiliate ? " sponsored" : ""}`}
            className="btn btn-primary btn-sm min-w-0 flex-1 justify-center"
          >
            {d.delivery === "store" ? t.deals.proof : t.deals.toOffer}<IconExternal width={15} height={15} className="shrink-0" />
          </a>
          <AddToCart compact item={{
            kind: "deal", ref: d.id, name: d.title.slice(0, 120), detail: d.merchant, rubric: cat?.rubric ?? null, image: d.image,
            priceCents: d.totalCents ?? d.priceCents, priceSource: d.source === "open-prices" ? "open_prices" : "deal", priceStore: d.merchant, priceDate: d.observedAt,
          }} />
          <button
            type="button"
            aria-expanded={watching}
            aria-label={`${t.deals.alarm}: ${d.title}`}
            title={watch ? fmt(t.deals.alarmSet, { price: money(watch.targetCents) }) : t.deals.alarm}
            onClick={() => setWatching(!watching)}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors ${watch ? "border-pine bg-pine-tint text-pine" : "border-line bg-paper text-pine hover:border-pine"}`}
          >
            <IconBell width={19} height={19} />
          </button>
        </div>
        {watching && <WatchForm deal={d} onDone={() => setWatching(false)} />}
        {watch && !watching && <p className="text-[0.75rem] font-semibold text-pine">{fmt(t.deals.alarmSet, { price: money(watch.targetCents) })}</p>}
      </div>
    </article>
  );
}
