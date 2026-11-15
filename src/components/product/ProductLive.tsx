"use client";
import { AddToCart } from "@/components/cart/Cart";
import { useEffect, useMemo, useState } from "react";
import { useCountry, useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { useJson } from "@/lib/use-json";
import { latestPerStore, type PricesResponse, type ProductSummary, type RatedObservation } from "@/lib/api-types";
import { detectIncrease } from "@/lib/alerts";
import { formatCents, toCents } from "@/lib/money";
import { formatDate, formatGrundpreis, relativeDays } from "@/lib/format";
import { packsNeeded, toQuantity } from "@/lib/units";
import { todayIso, uid, updateData, useAppData } from "@/lib/store/local";
import { PriceTag } from "@/components/ui/PriceTag";
import { Notice } from "@/components/ui/Notice";
import { PriceHistory } from "@/components/charts/Charts";
import { IconBell, IconExternal, IconList, IconStar } from "@/components/ui/icons";

export function ProductLive({ product }: { product: ProductSummary }) {
  const { t, intl } = useI18n();
  const country = useCountry();
  const res = useJson<PricesResponse>(`/api/prices?codes=${product.code}&country=${country}`);
  const obs = useMemo(() => (res.status === "ok" ? res.data.observations : []), [res.status, res.data]);
  const perStore = useMemo(() => latestPerStore(obs), [obs]);
  const flagged = obs.filter((o) => !o.quality.usable || o.quality.flags.length);
  const cheapest = perStore[0] ?? null;

  // Verlauf: Geschäft mit den meisten verwendbaren Beobachtungen
  const history = useMemo(() => {
    const byStore = new Map<string, RatedObservation[]>();
    for (const o of obs) if (o.quality.usable && o.pricePer === "item") {
      const k = String(o.store.locationId ?? o.store.name);
      byStore.set(k, [...(byStore.get(k) ?? []), o]);
    }
    return [...byStore.values()].sort((a, b) => b.length - a.length)[0] ?? [];
  }, [obs]);
  const increase = history.length >= 2 ? detectIncrease(history) : null;
  const countryName = t.common.countries[country];
  const data = useAppData();
  const unnamedScan = !!product.name && data.scans.some((s) => s.code === product.code && !s.name);
  useEffect(() => {
    // Zuletzt gescannte Produkte erhalten ihren Namen, sobald er bekannt ist
    if (unnamedScan) updateData((d) => ({ ...d, scans: d.scans.map((s) => (s.code === product.code ? { ...s, name: product.name } : s)) }));
  }, [unnamedScan, product.code, product.name]);

  return (
    <div className="space-y-10">
      <ProductActions product={product} cheapest={cheapest} />

      <section aria-labelledby="prices-title">
        <h2 id="prices-title" className="text-xl font-bold">{fmt(t.product.pricesTitle, { country: countryName })}</h2>
        <p className="mt-1 text-sm text-ink-soft">{t.product.pricesIntro}</p>
        <div className="mt-5">
          {res.status === "loading" && <div className="h-32 animate-pulse rounded-[var(--radius-panel)] bg-mist-strong" />}
          {res.status === "error" && (
            <Notice tone="danger" action={<button className="btn btn-quiet btn-sm" onClick={res.reload}>{t.common.retry}</button>}>{t.common.sourceDown}</Notice>
          )}
          {res.status === "ok" && perStore.length === 0 && (
            <div className="max-w-sm space-y-3">
              <PriceTag price={null} emptyLabel={t.common.priceUnavailable} store={countryName} />
              <p className="text-sm text-ink-soft">{fmt(t.product.noPrices, { country: countryName })} {t.product.noPricesHint}</p>
            </div>
          )}
          {perStore.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {perStore.map((o, i) => (
                <li key={o.id}>
                  <PriceTag
                    highlight={i === 0 && perStore.length > 1}
                    price={formatCents(o.priceCents, intl)}
                    unitPrice={formatGrundpreis(o.priceCents, product.packageBase, product.packageDimension, intl, t)}
                    store={<span>{o.store.name}{o.store.city ? `, ${o.store.city}` : ""}</span>}
                    badge={o.isDiscounted ? <span className="chip bg-saffron-tint text-saffron-text">{t.product.discounted}</span> : undefined}
                    footer={
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                        <span>{formatDate(o.date, intl)} ({relativeDays(o.date, t)})</span>
                        <span className="flex items-center gap-2">
                          {t.dataType[o.dataType]}
                          {o.proofUrl && (
                            <a href={o.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-pine underline underline-offset-2">
                              {t.product.proof}<IconExternal width={12} height={12} />
                            </a>
                          )}
                        </span>
                        {o.quality.flags.includes("stale") && <span className="w-full font-semibold text-saffron-text">{t.quality.stale}</span>}
                        {o.isDiscounted && o.priceWithoutDiscountCents && (
                          <span className="w-full">{fmt(t.product.regular, { price: formatCents(o.priceWithoutDiscountCents, intl) })}</span>
                        )}
                      </div>
                    }
                    emptyLabel={t.common.priceUnavailable}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {res.status === "ok" && obs.length > 0 && (
        <section aria-labelledby="history-title" className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 id="history-title" className="text-lg font-bold">
              {t.product.history}{history.length >= 2 ? `: ${history[0].store.name}` : ""}
            </h2>
            {history.length >= 2 ? (
              <div className="panel mt-3 p-3">
                <PriceHistory points={history.map((o) => ({ date: o.date, cents: o.priceCents }))} format={(c) => formatCents(c, intl)} label={t.product.history} />
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">{t.product.historyTooFew}</p>
            )}
            {increase && <Notice tone="warn">{fmt(t.product.increase, { pct: Math.round(increase.percent) })}</Notice>}
          </div>
          {flagged.some((o) => !o.quality.usable) && (
            <div>
              <h2 className="text-lg font-bold">{t.quality.excluded}</h2>
              <ul className="mt-3 divide-y divide-line rounded-[var(--radius-panel)] border border-line bg-paper text-sm">
                {flagged.filter((o) => !o.quality.usable).map((o) => (
                  <li key={o.id} className="flex flex-wrap justify-between gap-2 px-3 py-2">
                    <span className="num">{formatCents(o.priceCents, intl)}, {o.store.name}, {formatDate(o.date, intl)}</span>
                    <span className="text-slate">{o.quality.flags.filter((f) => f !== "stale").map((f) => t.quality[f]).join(", ")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function ProductActions({ product, cheapest }: { product: ProductSummary; cheapest: RatedObservation | null }) {
  const { t, intl } = useI18n();
  const country = useCountry();
  const data = useAppData();
  const [panel, setPanel] = useState<"list" | "alert" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const favorite = data.favorites.some((f) => f.code === product.code);
  const name = product.name ?? product.code;

  // Liste
  const [listId, setListId] = useState<string>("");
  const [packs, setPacks] = useState("1");
  const [needAmount, setNeedAmount] = useState("");
  const [needUnit, setNeedUnit] = useState<"g" | "kg" | "ml" | "l">(product.packageDimension === "volume" ? "l" : "kg");
  const packQty = product.packageBase && product.packageDimension ? { base: product.packageBase, dimension: product.packageDimension } : null;
  const need = needAmount ? toQuantity(Number(needAmount.replace(",", ".")), needUnit) : null;
  const neededPacks = need && packQty ? packsNeeded(need, packQty) : null;

  function addToList() {
    const qty = neededPacks ?? Math.max(1, Number(packs) || 1);
    const now = new Date().toISOString();
    let target = data.lists.find((l) => l.id === listId) ?? data.lists[0];
    const item = {
      id: uid(), name: [name, product.quantityText].filter(Boolean).join(" "), quantity: qty, category: "",
      priceCents: cheapest?.priceCents ?? null, priceSource: cheapest ? ("open_prices" as const) : null,
      priceDate: cheapest?.date ?? null, priceStore: cheapest?.store.name ?? null,
      productCode: product.code, quantityText: product.quantityText, checked: false,
    };
    updateData((d) => {
      if (!target) {
        target = { id: uid(), name: t.lists.defaultName, kind: "shopping", createdAt: now, updatedAt: now, items: [] };
        d.lists.push(target);
      }
      d.lists = d.lists.map((l) => (l.id === target!.id ? { ...l, updatedAt: now, items: [...l.items, item] } : l));
      return d;
    });
    setMessage(fmt(t.product.addedToList, { list: target?.name ?? t.lists.defaultName }));
    setPanel(null);
  }

  // Alarm
  const [threshold, setThreshold] = useState(cheapest ? ((cheapest.priceCents - 1) / 100).toFixed(2).replace(".", ",") : "");
  function createAlert() {
    const cents = toCents(threshold);
    if (!cents || cents <= 0) return;
    updateData((d) => ({
      ...d,
      alerts: [...d.alerts, { id: uid(), productCode: product.code, productName: name, thresholdCents: cents, country, createdAt: new Date().toISOString(), notifiedIds: [] }],
    }));
    setMessage(t.radar.created);
    setPanel(null);
  }

  function toggleFavorite() {
    updateData((d) => ({
      ...d,
      favorites: favorite ? d.favorites.filter((f) => f.code !== product.code) : [...d.favorites, { code: product.code, name, quantityText: product.quantityText, addedAt: todayIso() }],
    }));
  }

  return (
    <section aria-label={t.product.addToList} className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <AddToCart item={{
          kind: "food", ref: product.code, name, detail: [product.brand, product.quantityText].filter(Boolean).join(", ") || null, rubric: null, image: null,
          priceCents: cheapest?.priceCents ?? null, priceSource: cheapest ? "open_prices" : null, priceStore: cheapest?.store.name ?? null, priceDate: cheapest?.date ?? null,
        }} />
        <button className="btn btn-quiet" aria-expanded={panel === "list"} onClick={() => { setPanel(panel === "list" ? null : "list"); setMessage(null); }}>
          <IconList width={18} height={18} />{t.product.addToList}
        </button>
        <button className="btn btn-quiet" aria-expanded={panel === "alert"} onClick={() => {
          setPanel(panel === "alert" ? null : "alert");
          setMessage(null);
          if (!threshold && cheapest) setThreshold(((cheapest.priceCents - 1) / 100).toFixed(2).replace(".", ","));
        }}>
          <IconBell width={18} height={18} />{t.product.watch}
        </button>
        <button className="btn btn-quiet" aria-pressed={favorite} onClick={toggleFavorite}>
          <IconStar width={18} height={18} fill={favorite ? "currentColor" : "none"} />{favorite ? t.product.favorited : t.product.favorite}
        </button>
      </div>
      {message && <Notice tone="success">{message}</Notice>}

      {panel === "list" && (
        <div className="panel grid gap-4 p-4 sm:grid-cols-3">
          {data.lists.length > 0 && (
            <div>
              <label className="label" htmlFor="pl-list">{t.nav.listsLong}</label>
              <select id="pl-list" className="field" value={listId || data.lists[0].id} onChange={(e) => setListId(e.target.value)}>
                {data.lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          )}
          {packQty ? (
            <div>
              <label className="label" htmlFor="pl-need">{t.product.needLabel} ({t.common.optional})</label>
              <div className="flex gap-2">
                <input id="pl-need" className="field num" inputMode="decimal" value={needAmount} onChange={(e) => setNeedAmount(e.target.value)} placeholder={product.quantityText ?? ""} />
                <select aria-label={t.home.calcUnit} className="field !w-auto" value={needUnit} onChange={(e) => setNeedUnit(e.target.value as typeof needUnit)}>
                  {(product.packageDimension === "volume" ? ["ml", "l"] : ["g", "kg"]).map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
              <p className="mt-1 text-xs text-ink-soft">{neededPacks ? fmt(t.product.packs, { n: neededPacks }) : t.product.needHint}</p>
            </div>
          ) : null}
          {!neededPacks && (
            <div>
              <label className="label" htmlFor="pl-packs">{t.common.quantity}</label>
              <input id="pl-packs" className="field num" inputMode="numeric" value={packs} onChange={(e) => setPacks(e.target.value)} />
            </div>
          )}
          <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">
              {cheapest
                ? `${formatCents(cheapest.priceCents, intl)} – ${cheapest.store.name}, ${formatDate(cheapest.date, intl)}`
                : t.common.priceUnavailable}
            </p>
            <button className="btn btn-primary" onClick={addToList}>{t.common.add}</button>
          </div>
        </div>
      )}

      {panel === "alert" && (
        <form className="panel flex flex-wrap items-end gap-3 p-4" onSubmit={(e) => { e.preventDefault(); createAlert(); }}>
          <div>
            <label className="label" htmlFor="pl-thr">{t.radar.threshold} (€)</label>
            <input id="pl-thr" className="field num !w-36" inputMode="decimal" value={threshold} onChange={(e) => setThreshold(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit">{t.radar.create}</button>
          <p className="w-full text-xs text-ink-soft">{t.radar.pushNote}</p>
        </form>
      )}
    </section>
  );
}
