"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { fmt } from "@/i18n";
import { toCents } from "@/lib/money";
import {
  bestOffers, dailyLows, forecastHints, historyGaps, referencePrice30, sparGuard, watchMatches, windowStats,
  type Availability, type Condition, type HistoryPoint, type Offer, type RankedOffer,
} from "@/lib/media/engine";
import { findMediaCategory } from "@/lib/media/specs";
import { uid, updateData, useAppData, useHydrated } from "@/lib/store/local";
import { Notice } from "@/components/ui/Notice";
import { IconBell, IconCompare, IconExternal, IconPlus, IconStar, IconTrash } from "@/components/ui/icons";
import { Freshness, bestNew, productTitle, schemaFor, specValue, useMedia } from "./shared";
import { AddToCart } from "@/components/cart/Cart";
import { rubricOf } from "@/lib/rubrics";

const CONDITIONS: Condition[] = ["new", "refurbished", "demo", "used", "digital", "subscription"];
const AVAILABILITIES: Availability[] = ["in_stock", "limited", "out_of_stock", "unknown"];

export function ProductView() {
  const id = useSearchParams().get("id") ?? "";
  const { locale, t } = useMedia();
  const data = useAppData();
  const hydrated = useHydrated();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!hydrated) return <div className="h-64 animate-pulse rounded-[var(--radius-panel)] bg-mist-strong" />;

  const product = data.products.find((p) => p.id === id);
  if (!product) {
    return (
      <Notice tone="warn" action={<Link className="btn btn-quiet btn-sm" href={`/${locale}/produkte`}>{t.nav.hub}</Link>}>{t.product.notFound}</Notice>
    );
  }
  const offers = data.offers.filter((o) => o.productId === product.id);
  const cat = findMediaCategory(product.category);

  function toggleWish() {
    updateData((d) => ({ ...d, products: d.products.map((p) => (p.id === id ? { ...p, wishlist: !p.wishlist } : p)) }));
  }
  function remove() {
    updateData((d) => ({
      ...d,
      products: d.products.filter((p) => p.id !== id),
      offers: d.offers.filter((o) => o.productId !== id),
      watches: d.watches.filter((w) => w.productId !== id),
    }));
    router.push(`/${locale}/produkte${cat ? `/c/${cat.slug}` : ""}`);
  }

  return (
    <div className="space-y-8">
      <h1 className="display text-[2rem] sm:text-[2.5rem]">{productTitle(product)}</h1>
      <div className="-mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        {cat && <Link href={`/${locale}/produkte/c/${cat.slug}`} className="text-pine underline-offset-4 hover:underline">{cat.label[locale]}</Link>}
        <span className="num text-ink-soft">{t.product.model}: {product.model || t.product.unknown}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <CartFor productId={product.id} />
        <button type="button" className="btn btn-quiet btn-sm" aria-pressed={product.wishlist} onClick={toggleWish}>
          <IconStar width={16} height={16} fill={product.wishlist ? "currentColor" : "none"} />
          {product.wishlist ? t.product.wishlistRemove : t.product.wishlistAdd}
        </button>
        <Link className="btn btn-quiet btn-sm" href={`/${locale}/produkte/compare?cat=${product.category}&ids=${encodeURIComponent(product.id)}`}>
          <IconCompare width={16} height={16} />{t.product.compareAdd}
        </Link>
        {confirmDelete ? (
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm">{fmt(t.product.confirmDelete, { name: productTitle(product) })}</span>
            <button type="button" className="btn btn-danger btn-sm" onClick={remove}>{t.product.delete}</button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setConfirmDelete(false)}>×</button>
          </span>
        ) : (
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => setConfirmDelete(true)}>
            <IconTrash width={16} height={16} />{t.product.delete}
          </button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-8">
          <OffersSection productId={product.id} offers={offers} />
          <HistorySection offers={offers} />
        </div>
        <div className="space-y-8">
          <SpecsPanel productId={product.id} />
          <WatchPanel productId={product.id} offers={offers} />
        </div>
      </div>
    </div>
  );
}

function CartFor({ productId }: { productId: string }) {
  const data = useAppData();
  const p = data.products.find((x) => x.id === productId)!;
  const best = bestNew(data.offers, productId);
  return (
    <AddToCart className="btn-sm" item={{
      kind: "product", ref: p.id, name: productTitle(p), detail: p.model || null, rubric: rubricOf(p.category, "products")?.slug ?? null, image: null,
      priceCents: best?.totalCents ?? null, priceSource: best ? "manual" : null, priceStore: best?.merchant ?? null, priceDate: best?.observedAt ?? null,
    }} />
  );
}

function OffersSection({ productId, offers }: { productId: string; offers: Offer[] }) {
  const { t } = useMedia();
  const [adding, setAdding] = useState(false);
  const groups = bestOffers(offers);
  const present = CONDITIONS.filter((c) => groups.get(c)?.length);
  return (
    <section aria-labelledby="offers-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="offers-title" className="text-xl font-bold">{t.offers.title}</h2>
          <p className="text-sm text-ink-soft">{t.offers.intro}</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" aria-expanded={adding} onClick={() => setAdding(!adding)}>
          <IconPlus width={16} height={16} />{t.offers.add}
        </button>
      </div>
      {adding && <OfferForm productId={productId} onDone={() => setAdding(false)} />}
      {!present.length && !adding && <p className="panel p-5 text-ink-soft">{t.offers.none}</p>}
      {present.map((c) => (
        <div key={c} className="panel overflow-hidden">
          <h3 className="border-b border-line px-4 py-2.5 font-bold">{t.offers.conditions[c]}</h3>
          <ul className="divide-y divide-line">
            {groups.get(c)!.map((o, i) => <OfferRow key={o.id} offer={o} all={offers} best={i === 0 && o.totalCents !== null && o.availability !== "out_of_stock"} />)}
          </ul>
        </div>
      ))}
    </section>
  );
}

function OfferRow({ offer, all, best }: { offer: RankedOffer; all: Offer[]; best: boolean }) {
  const { t, money } = useMedia();
  const guard = sparGuard(offer, all);
  const ref = referencePrice30(all, offer.merchant, offer.condition, offer.observedAt);
  const warnings = guard.filter((g) => g.level === "warning");
  const unknown = guard.filter((g) => g.level === "unknown");
  return (
    <li className="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            {offer.url ? (
              <a href={offer.url} target="_blank" rel="nofollow noopener noreferrer" className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
                {offer.merchant}<IconExternal width={14} height={14} />
              </a>
            ) : offer.merchant}
            {best && <span className="chip bg-saving text-white">{t.offers.best}</span>}
            <Freshness offer={offer} />
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {t.offers.availabilities[offer.availability]}
            {offer.warrantyMonths !== null && ` · ${t.offers.warranty.replace(/\s*\(.*\)/, "")} ${offer.warrantyMonths} ${t.units.Monate}`}
            {offer.promo && ` · ${offer.promo}`}
          </p>
        </div>
        <div className="text-right">
          <p className="price text-2xl">{offer.totalCents !== null ? money(offer.totalCents) : money(offer.priceCents)}</p>
          <p className="num text-xs text-ink-soft">
            {offer.shippingCents === null
              ? `${money(offer.priceCents)} + ${t.offers.shippingUnknown}`
              : `${money(offer.priceCents)} + ${money(offer.shippingCents)} ${t.offers.shipping.replace(/\s*\(.*\)/, "")}`}
          </p>
        </div>
      </div>
      {ref !== null ? (
        <p className="text-sm text-ink-soft">{fmt(t.history.reference, { price: money(ref) })}</p>
      ) : offer.promo ? (
        <p className="text-sm text-ink-soft">{t.history.referenceUnknown}</p>
      ) : null}
      {(warnings.length > 0 || unknown.length > 0) && (
        <div className="flex flex-wrap gap-1.5" aria-label={t.guard.title}>
          {warnings.map((g) => (
            <span key={g.code} className="chip border border-saffron/60 bg-saffron-tint text-saffron-text">
              {g.code === "price_far_below_market" ? fmt(t.guard.price_far_below_market, { price: money(g.medianCents) }) : t.guard.not_new}
            </span>
          ))}
          {unknown.map((g) => <span key={g.code} className="chip border border-line text-ink-soft">{t.guard[g.code]}</span>)}
        </div>
      )}
      <button
        type="button"
        className="text-sm text-ink-soft underline-offset-4 hover:text-danger hover:underline"
        onClick={() => updateData((d) => ({ ...d, offers: d.offers.filter((o) => o.id !== offer.id) }))}
      >
        {t.offers.delete}
      </button>
    </li>
  );
}

function nowLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function OfferForm({ productId, onDone }: { productId: string; onDone: () => void }) {
  const { t } = useMedia();
  const [error, setError] = useState<string | null>(null);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const price = toCents(String(f.get("price") ?? ""));
    const shipRaw = String(f.get("shipping") ?? "").trim();
    const shipping = shipRaw ? toCents(shipRaw) : null;
    const warrantyRaw = String(f.get("warranty") ?? "").trim();
    const observed = new Date(String(f.get("observed") ?? ""));
    if (price === null || (shipRaw && shipping === null) || Number.isNaN(observed.getTime())) {
      setError(t.offers.price);
      return;
    }
    const imprint = String(f.get("imprint") ?? "unknown");
    const url = String(f.get("url") ?? "").trim();
    const promo = String(f.get("promo") ?? "").trim();
    const offer: Offer = {
      id: uid(),
      productId,
      merchant: String(f.get("merchant") ?? "").trim(),
      url: url || null,
      priceCents: price,
      shippingCents: shipping,
      condition: String(f.get("condition")) as Condition,
      availability: String(f.get("availability")) as Availability,
      warrantyMonths: warrantyRaw ? Math.max(0, Math.round(Number(warrantyRaw))) : null,
      observedAt: observed.toISOString(),
      source: "manual",
      promo: promo || null,
      merchantImprint: imprint === "unknown" ? null : imprint === "yes",
    };
    const res = updateData((d) => ({ ...d, offers: [...d.offers, offer] }));
    if (!res.ok) setError(res.error);
    else onDone();
  }
  return (
    <form onSubmit={submit} className="panel grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
      <div>
        <label className="label" htmlFor="of-merchant">{t.offers.merchant}</label>
        <input id="of-merchant" name="merchant" className="field" required maxLength={80} />
      </div>
      <div>
        <label className="label" htmlFor="of-url">{t.offers.url}</label>
        <input id="of-url" name="url" className="field" type="url" maxLength={500} placeholder="https://" />
      </div>
      <div>
        <label className="label" htmlFor="of-price">{t.offers.price}</label>
        <input id="of-price" name="price" className="field num" required inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,2})?" />
      </div>
      <div>
        <label className="label" htmlFor="of-ship">{t.offers.shipping}</label>
        <input id="of-ship" name="shipping" className="field num" inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,2})?" placeholder={t.offers.shippingUnknown} />
      </div>
      <div>
        <label className="label" htmlFor="of-cond">{t.offers.condition}</label>
        <select id="of-cond" name="condition" className="field" defaultValue="new">
          {CONDITIONS.map((c) => <option key={c} value={c}>{t.offers.conditions[c]}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="of-avail">{t.offers.availability}</label>
        <select id="of-avail" name="availability" className="field" defaultValue="in_stock">
          {AVAILABILITIES.map((a) => <option key={a} value={a}>{t.offers.availabilities[a]}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="of-warranty">{t.offers.warranty}</label>
        <input id="of-warranty" name="warranty" className="field num" type="number" min={0} max={240} />
      </div>
      <div>
        <label className="label" htmlFor="of-observed">{t.offers.observed}</label>
        <input id="of-observed" name="observed" className="field" type="datetime-local" required defaultValue={nowLocal()} />
      </div>
      <div>
        <label className="label" htmlFor="of-imprint">{t.offers.imprint}</label>
        <select id="of-imprint" name="imprint" className="field" defaultValue="unknown">
          {(["unknown", "yes", "no"] as const).map((v) => <option key={v} value={v}>{t.offers.imprintOptions[v]}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="of-promo">{t.offers.promo}</label>
        <input id="of-promo" name="promo" className="field" maxLength={200} />
      </div>
      {error && <div className="sm:col-span-2"><Notice tone="danger">{error}</Notice></div>}
      <div className="sm:col-span-2">
        <button type="submit" className="btn btn-primary">{t.product.save}</button>
      </div>
    </form>
  );
}

function SpecsPanel({ productId }: { productId: string }) {
  const { locale, intl, t } = useMedia();
  const product = useAppData().products.find((p) => p.id === productId)!;
  const defs = schemaFor(product);
  return (
    <section aria-labelledby="specs-title" className="panel p-4 sm:p-5">
      <h2 id="specs-title" className="text-lg font-bold">{t.product.specs}</h2>
      <dl className="mt-3 divide-y divide-line">
        {defs.map((def) => {
          const v = specValue(def, product.specs[def.key], t, intl);
          return (
            <div key={def.key} className="flex justify-between gap-4 py-2 text-[0.95rem]">
              <dt className="text-ink-soft">{def.label[locale]}</dt>
              <dd className={`num text-right ${v === null ? "text-slate" : "font-semibold"}`}>{v ?? t.product.unknown}</dd>
            </div>
          );
        })}
      </dl>
      <p className="mt-3 text-sm text-ink-soft">
        {t.product.sourceLabel}:{" "}
        {product.specSource ? (
          <a href={product.specSource} target="_blank" rel="nofollow noopener noreferrer" className="text-pine underline underline-offset-4">
            {new URL(product.specSource).hostname}
          </a>
        ) : t.product.noSource}
      </p>
    </section>
  );
}

function WatchPanel({ productId, offers }: { productId: string; offers: Offer[] }) {
  const { t, tm, money } = useMedia();
  const data = useAppData();
  const watches = data.watches.filter((w) => w.productId === productId);
  const matches = watchMatches(watches, offers);
  const [error, setError] = useState<string | null>(null);

  function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const cents = toCents(String(f.get("threshold") ?? ""));
    if (!cents) {
      setError(t.watch.threshold);
      return;
    }
    const condition = String(f.get("condition")) as Condition;
    updateData((d) => ({
      ...d,
      watches: [...d.watches, { id: uid(), productId, thresholdCents: cents, condition, createdAt: new Date().toISOString(), notifiedOfferIds: [] }],
    }));
    e.currentTarget.reset();
    setError(null);
  }

  return (
    <section aria-labelledby="watch-title" className="panel p-4 sm:p-5">
      <h2 id="watch-title" className="flex items-center gap-2 text-lg font-bold"><IconBell width={18} height={18} />{t.watch.title}</h2>
      {matches.map(({ watchId, offer }) => (
        <div key={offer.id} className="mt-3">
          <Notice
            tone="success"
            action={
              <button
                type="button"
                className="btn btn-quiet btn-sm"
                onClick={() => updateData((d) => ({ ...d, watches: d.watches.map((w) => (w.id === watchId ? { ...w, notifiedOfferIds: [...w.notifiedOfferIds, offer.id] } : w)) }))}
              >
                {t.watch.seen}
              </button>
            }
          >
            {fmt(t.watch.match, { merchant: offer.merchant, price: money(offer.priceCents + (offer.shippingCents ?? 0)) })}
          </Notice>
        </div>
      ))}
      {watches.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {watches.map((w) => (
            <li key={w.id} className="flex items-center justify-between gap-2 text-[0.95rem]">
              <span className="num">{fmt(tm.watches.threshold, { price: money(w.thresholdCents), condition: t.offers.conditions[w.condition] })}</span>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-mist-strong hover:text-danger"
                aria-label={tm.watches.remove}
                onClick={() => updateData((d) => ({ ...d, watches: d.watches.filter((x) => x.id !== w.id) }))}
              >
                <IconTrash width={16} height={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div>
          <label className="label" htmlFor="w-threshold">{t.watch.threshold}</label>
          <input id="w-threshold" name="threshold" className="field num" required inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,2})?" />
        </div>
        <div>
          <label className="label" htmlFor="w-cond">{t.offers.condition}</label>
          <select id="w-cond" name="condition" className="field" defaultValue="new">
            {CONDITIONS.map((c) => <option key={c} value={c}>{t.offers.conditions[c]}</option>)}
          </select>
        </div>
        {error && <p className="text-sm text-danger sm:col-span-2 lg:col-span-1 xl:col-span-2">{error}</p>}
        <button type="submit" className="btn btn-primary btn-sm justify-self-start">{t.watch.create}</button>
      </form>
    </section>
  );
}

function HistorySection({ offers }: { offers: Offer[] }) {
  const { t, money } = useMedia();
  const available = CONDITIONS.filter((c) => offers.some((o) => o.condition === c));
  const [condition, setCondition] = useState<Condition>(available[0] ?? "new");
  const active = available.includes(condition) ? condition : (available[0] ?? "new");
  const points = dailyLows(offers, active);
  const gaps = historyGaps(points);
  const current = (bestOffers(offers).get(active) ?? []).find((o) => o.totalCents !== null)?.totalCents ?? null;
  const hints = forecastHints(points, current);
  const stats = [30, 90, 180].map((d) => windowStats(points, d));

  return (
    <section aria-labelledby="hist-title" className="panel space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="hist-title" className="text-lg font-bold">{t.history.title}</h2>
        {available.length > 1 && (
          <select aria-label={t.offers.condition} className="field w-auto" value={active} onChange={(e) => setCondition(e.target.value as Condition)}>
            {available.map((c) => <option key={c} value={c}>{t.offers.conditions[c]}</option>)}
          </select>
        )}
      </div>
      {points.length < 2 ? (
        <p className="text-ink-soft">{t.history.tooFew}</p>
      ) : (
        <GapChart points={points} format={money} label={t.history.title} />
      )}
      {gaps.length > 0 && <p className="text-sm text-saffron-text">{fmt(t.history.gaps, { n: gaps.length })}</p>}
      <dl className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.days} className="rounded-xl border border-line p-3">
            {s.enough ? (
              <>
                <dt className="text-sm text-ink-soft">{fmt(t.history.low, { days: s.days })}</dt>
                <dd className="price text-xl">{money(s.lowCents!)}</dd>
                <dd className="num text-sm text-ink-soft">{fmt(t.history.avg, { days: s.days })}: {money(s.avgCents!)}</dd>
              </>
            ) : (
              <>
                <dt className="sr-only">{fmt(t.history.low, { days: s.days })}</dt>
                <dd className="text-sm text-ink-soft">{fmt(t.history.notEnough, { days: s.days })}</dd>
              </>
            )}
          </div>
        ))}
      </dl>
      <ul className="space-y-1 text-[0.95rem]">
        {hints.map((h, i) => (
          <li key={i}>
            {h.kind === "insufficient" && t.history.insufficient}
            {h.kind === "near_low" && fmt(t.history.near_low, { price: money(h.lowCents) })}
            {h.kind === "often_lower" && fmt(t.history.often_lower, { n: h.times, price: money(h.lowCents) })}
            {h.kind === "jump" && fmt(t.history.jump, { pct: h.percent > 0 ? `+${h.percent}` : h.percent })}
          </li>
        ))}
      </ul>
      <p className="text-sm text-ink-soft">{t.history.disclaimer}</p>
    </section>
  );
}

/** Preisverlauf mit sichtbaren Lücken: die Linie wird bei mehr als 7 Tagen ohne Beobachtung unterbrochen. */
function GapChart({ points, format, label }: { points: HistoryPoint[]; format: (c: number) => string; label: string }) {
  const W = 600, H = 190, P = 30;
  const day = (d: string) => Date.parse(`${d}T00:00:00Z`) / 86_400_000;
  const d0 = day(points[0].day), d1 = Math.max(d0 + 1, day(points[points.length - 1].day));
  const vals = points.map((p) => p.cents);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = Math.max(1, (hi - lo) * 0.2);
  const x = (d: string) => P + ((day(d) - d0) / (d1 - d0)) * (W - 2 * P);
  const y = (c: number) => H - P - ((c - (lo - pad)) / (hi + pad - (lo - pad))) * (H - 2 * P);
  const segments: HistoryPoint[][] = [];
  points.forEach((p, i) => {
    if (i === 0 || day(p.day) - day(points[i - 1].day) > 7) segments.push([p]);
    else segments[segments.length - 1].push(p);
  });
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
        <line x1={P} x2={W - P} y1={y(lo)} y2={y(lo)} stroke="var(--line)" strokeDasharray="4 4" />
        <line x1={P} x2={W - P} y1={y(hi)} y2={y(hi)} stroke="var(--line)" strokeDasharray="4 4" />
        <text x={W - P} y={y(hi) - 6} textAnchor="end" fontSize="13" fill="var(--ink-soft)">{format(hi)}</text>
        <text x={W - P} y={y(lo) + 16} textAnchor="end" fontSize="13" fill="var(--ink-soft)">{format(lo)}</text>
        {segments.slice(1).map((seg, i) => {
          const prev = segments[i][segments[i].length - 1];
          // Lücke: gestrichelte Verbindung in Warnfarbe – keine erfundenen Zwischenwerte
          return (
            <line key={`g${i}`} x1={x(prev.day)} y1={y(prev.cents)} x2={x(seg[0].day)} y2={y(seg[0].cents)} stroke="var(--saffron)" strokeWidth="1.5" strokeDasharray="3 5" opacity="0.8" />
          );
        })}
        {segments.map((seg, i) => (
          <path
            key={i}
            d={seg.map((p, j) => `${j === 0 ? "M" : "L"}${x(p.day).toFixed(1)},${y(p.cents).toFixed(1)}`).join(" ")}
            fill="none"
            stroke="var(--pine)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        ))}
        {points.map((p) => (
          <circle key={p.day} cx={x(p.day)} cy={y(p.cents)} r="3.5" fill="var(--paper)" stroke="var(--pine)" strokeWidth="2">
            <title>{`${p.day}: ${format(p.cents)}`}</title>
          </circle>
        ))}
        <text x={P} y={H - 8} fontSize="12" fill="var(--ink-soft)">{points[0].day}</text>
        <text x={W - P} y={H - 8} textAnchor="end" fontSize="12" fill="var(--ink-soft)">{points[points.length - 1].day}</text>
      </svg>
    </figure>
  );
}
