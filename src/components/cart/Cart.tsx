"use client";
// Einkaufswagen als kleines Fenster: sammelt Artikel aus allen Rubriken und macht daraus eine Einkaufsliste.
// Es gibt keinen Kauf- oder Bezahlweg – der Wagen dient nur zum Zusammenstellen.
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { addToCart, cartToListItems, cartTotals, setCartQuantity, type NewCartItem } from "@/lib/cart";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { findRubric } from "@/lib/rubrics";
import { uid, updateData, useAppData, useHydrated } from "@/lib/store/local";
import { IconCart, IconCheck, IconClose, IconMinus, IconPlus, IconTrash } from "@/components/ui/icons";

const ADDED = "pp:cart-added";

/** Knopf „In den Einkaufswagen“ – als volle Schaltfläche oder kompakt als Symbol */
export function AddToCart({ item, compact = false, className = "" }: { item: NewCartItem; compact?: boolean; className?: string }) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(false), 1800);
    return () => clearTimeout(timer);
  }, [done]);

  function add() {
    updateData((d) => ({ ...d, cart: addToCart(d.cart, item, uid(), new Date().toISOString()) }));
    setDone(true);
    window.dispatchEvent(new CustomEvent(ADDED));
  }
  const label = done ? t.cart.added : t.cart.add;
  if (compact) {
    return (
      <button
        type="button"
        onClick={add}
        aria-label={`${t.cart.add}: ${item.name}`}
        title={t.cart.add}
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors ${done ? "border-saving bg-saving text-white" : "border-line bg-paper text-pine hover:border-pine"} ${className}`}
      >
        {done ? <IconCheck width={20} height={20} /> : <IconCart width={20} height={20} />}
      </button>
    );
  }
  return (
    <button type="button" onClick={add} className={`btn ${done ? "btn-quiet" : "btn-primary"} ${className}`}>
      {done ? <IconCheck width={18} height={18} /> : <IconCart width={18} height={18} />}
      {label}
    </button>
  );
}

export function CartButton() {
  const { t } = useI18n();
  const data = useAppData();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const count = hydrated ? cartTotals(data.cart).count : 0;

  useEffect(() => {
    const onAdded = () => {
      setPulse(true);
      setTimeout(() => setPulse(false), 700);
    };
    window.addEventListener(ADDED, onAdded);
    return () => window.removeEventListener(ADDED, onAdded);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => wrap.current && !wrap.current.contains(e.target as Node) && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={fmt(t.cart.open, { n: count })}
        onClick={() => setOpen(!open)}
        title={t.cart.title}
        className={`relative grid h-11 w-11 place-items-center rounded-full text-white transition-transform hover:bg-white/10 ${pulse ? "scale-125" : ""}`}
      >
        <IconCart width={25} height={25} />
        <span className="num absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-aqua px-1 text-[0.72rem] font-bold text-petrol">{count}</span>
      </button>
      {open && <CartPanel onClose={() => setOpen(false)} />}
    </div>
  );
}

function CartPanel({ onClose }: { onClose: () => void }) {
  const { t, locale, intl } = useI18n();
  const data = useAppData();
  const [target, setTarget] = useState("new");
  const [saved, setSaved] = useState<string | null>(null);
  const cart = data.cart;
  const totals = cartTotals(cart);
  const money = (c: number) => formatCents(c, intl);

  // Nach Rubriken gruppiert, in der Reihenfolge des ersten Auftretens
  const groups = new Map<string, typeof cart>();
  for (const c of cart) {
    const key = c.rubric ?? (c.kind === "food" ? "lebensmittel" : "other");
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }
  const rubricLabel = (key: string) => findRubric(key)?.label[locale] ?? t.cart.other;

  function save() {
    const now = new Date().toISOString();
    const items = cartToListItems(cart, uid, (c) => rubricLabel(c.rubric ?? (c.kind === "food" ? "lebensmittel" : "other")));
    let name = "";
    updateData((d) => {
      const existing = d.lists.find((l) => l.id === target);
      if (existing) {
        name = existing.name;
        d.lists = d.lists.map((l) => (l.id === existing.id ? { ...l, updatedAt: now, items: [...l.items, ...items] } : l));
      } else {
        name = fmt(t.cart.listName, { date: formatDate(now.slice(0, 10), intl) });
        d.lists = [...d.lists, { id: uid(), name, kind: "shopping", createdAt: now, updatedAt: now, items }];
      }
      return { ...d, cart: [] };
    });
    setSaved(name);
  }

  return (
    <div
      role="dialog"
      aria-label={t.cart.title}
      className="fixed inset-x-2 top-[4.9rem] z-40 flex max-h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-2xl border border-line bg-paper text-ink shadow-[0_24px_60px_-20px_rgba(6,23,33,0.55)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.6rem)] sm:w-[26rem]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line bg-gradient-to-r from-petrol to-petrol-2 px-4 py-3 text-white">
        <p className="flex items-center gap-2 font-bold"><IconCart width={20} height={20} />{t.cart.title} · {totals.count}</p>
        <button type="button" onClick={onClose} aria-label={t.common.close} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10">
          <IconClose width={18} height={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {saved ? (
          <div className="space-y-3 py-4 text-center">
            <p className="font-semibold">{fmt(t.cart.saved, { list: saved })}</p>
            <Link href={`/${locale}/lists`} onClick={onClose} className="btn btn-primary">{t.cart.toLists}</Link>
          </div>
        ) : !cart.length ? (
          <p className="py-6 text-center text-ink-soft">{t.cart.empty}</p>
        ) : (
          [...groups.entries()].map(([key, items]) => (
            <section key={key} className="mb-3">
              <h3 className="mb-1 text-sm font-bold text-pine">{rubricLabel(key)}</h3>
              <ul className="divide-y divide-line">
                {items.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-2.5">
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-mist">
                      {c.image && <Image src={c.image} alt="" fill sizes="44px" className="object-contain p-0.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold leading-tight">{c.name}</span>
                      <span className="block truncate text-xs text-ink-soft">
                        {c.priceCents !== null
                          ? [money(c.priceCents), c.priceStore, c.priceDate ? formatDate(c.priceDate.slice(0, 10), intl) : null].filter(Boolean).join(" · ")
                          : t.cart.priceUnknown}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <button type="button" aria-label={`${t.cart.decrease}: ${c.name}`} className="grid h-8 w-8 place-items-center rounded-full border border-line hover:border-pine"
                        onClick={() => updateData((d) => ({ ...d, cart: setCartQuantity(d.cart, c.id, c.quantity - 1) }))}>
                        {c.quantity > 1 ? <IconMinus width={14} height={14} /> : <IconTrash width={14} height={14} />}
                      </button>
                      <span className="num w-6 text-center font-semibold" aria-live="polite">{c.quantity}</span>
                      <button type="button" aria-label={`${t.cart.increase}: ${c.name}`} className="grid h-8 w-8 place-items-center rounded-full border border-line hover:border-pine"
                        onClick={() => updateData((d) => ({ ...d, cart: setCartQuantity(d.cart, c.id, c.quantity + 1) }))}>
                        <IconPlus width={14} height={14} />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      {!saved && cart.length > 0 && (
        <div className="space-y-3 border-t border-line bg-mist px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-ink-soft">{t.cart.knownSum}</span>
            <span className="price text-2xl">{money(totals.knownCents)}</span>
          </div>
          {totals.missing > 0 && <p className="-mt-2 text-right text-xs text-ink-soft">{fmt(t.cart.missing, { n: totals.missing })}</p>}
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor="cart-target" className="label">{t.cart.target}</label>
              <select id="cart-target" className="field" value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="new">{t.cart.newList}</option>
                {data.lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <button type="button" className="btn btn-primary w-full" onClick={save}>{t.cart.save}</button>
          <div className="flex items-center justify-between text-xs text-ink-soft">
            <span>{t.cart.note}</span>
            <button type="button" className="shrink-0 underline-offset-4 hover:text-danger hover:underline" onClick={() => updateData((d) => ({ ...d, cart: [] }))}>{t.cart.clear}</button>
          </div>
        </div>
      )}
    </div>
  );
}
