// Einkaufswagen-Logik (rein, ohne Speicher): Zusammenführen, Mengen, Summen, Übernahme in eine Einkaufsliste.
import type { CartItem, ListItem } from "@/lib/store/schema";
import { multiplyCents, sumCents } from "@/lib/money";

export type NewCartItem = Omit<CartItem, "id" | "addedAt" | "quantity"> & { quantity?: number };

/** Gleicher Artikel (Art + Referenz) wird nicht doppelt angelegt, sondern in der Menge erhöht. */
export function addToCart(cart: readonly CartItem[], item: NewCartItem, id: string, now: string): CartItem[] {
  const qty = item.quantity ?? 1;
  const existing = cart.find((c) => c.kind === item.kind && c.ref === item.ref);
  if (existing) return cart.map((c) => (c === existing ? { ...c, quantity: Math.min(999, c.quantity + qty) } : c));
  return [...cart, { ...item, id, quantity: qty, addedAt: now }];
}

export function setCartQuantity(cart: readonly CartItem[], id: string, quantity: number): CartItem[] {
  if (quantity <= 0) return cart.filter((c) => c.id !== id);
  return cart.map((c) => (c.id === id ? { ...c, quantity: Math.min(999, quantity) } : c));
}

export interface CartTotals { count: number; knownCents: number; missing: number }

/** Summe nur aus bekannten Preisen; Artikel ohne Preis werden gezählt, nicht geschätzt. */
export function cartTotals(cart: readonly CartItem[]): CartTotals {
  const known = cart.filter((c) => c.priceCents !== null);
  return {
    count: cart.reduce((n, c) => n + c.quantity, 0),
    knownCents: sumCents(known.map((c) => multiplyCents(c.priceCents!, c.quantity))),
    missing: cart.length - known.length,
  };
}

/** Wandelt den Wagen in Listenpositionen um; Preise behalten Quelle, Geschäft und Datum. */
export function cartToListItems(cart: readonly CartItem[], makeId: () => string, categoryOf: (c: CartItem) => string): ListItem[] {
  return cart.map((c) => ({
    id: makeId(),
    name: c.name.slice(0, 120),
    quantity: c.quantity,
    category: categoryOf(c).slice(0, 40),
    priceCents: c.priceCents,
    priceSource: c.priceSource,
    priceDate: c.priceDate,
    priceStore: c.priceStore,
    productCode: c.kind === "food" ? c.ref : null,
    quantityText: c.detail,
    checked: false,
  }));
}
