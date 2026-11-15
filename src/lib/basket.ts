// Smart Basket: Wo ist der Einkauf nach belegten Preisen am günstigsten?
// Grundsatz: Es werden nur bestätigte Teilsummen verglichen, unbekannte Preise bleiben unbekannt.
import { multiplyCents, sumCents } from "./money";
import type { PriceObservation } from "./sources/types";

export interface BasketItem {
  id: string;
  productCode: string | null;
  /** Anzahl Packungen */
  packs: number;
}

export interface StoreLine {
  itemId: string;
  unitCents: number;
  totalCents: number;
  date: string;
  observationId: string;
  storeKey: string;
}

export interface StoreBasket {
  key: string;
  label: string;
  locations: number;
  lines: StoreLine[];
  missingItemIds: string[];
  subtotalCents: number;
  oldestDate: string | null;
}

export interface SplitBasket {
  stores: [string, string];
  lines: StoreLine[];
  missingItemIds: string[];
  subtotalCents: number;
  /** Ersparnis gegenüber Variante A, nur über Positionen, die in beiden Varianten belegt sind */
  savingsCents: number;
  comparedItemIds: string[];
  worthIt: boolean;
}

export interface BasketResult {
  linkedCount: number;
  unlinkedItemIds: string[];
  stores: StoreBasket[];
  /** Variante A: alles in einem Geschäft */
  single: { store: StoreBasket; complete: boolean } | null;
  /** Variante B: auf zwei Geschäfte verteilt */
  split: SplitBasket | null;
}

export interface BasketOptions {
  groupBy: "chain" | "location";
  /** Mindestersparnis in Cent, ab der sich ein zweites Geschäft lohnt */
  minSavingsCents: number;
}

function storeKey(o: PriceObservation, groupBy: BasketOptions["groupBy"]): { key: string; label: string } {
  if (groupBy === "chain" && o.store.chain) {
    return { key: `chain:${o.store.chain.toLowerCase()}`, label: o.store.chain };
  }
  const label = o.store.city ? `${o.store.name}, ${o.store.city}` : o.store.name;
  return { key: `loc:${o.store.locationId ?? o.store.name}`, label };
}

const newer = (a: PriceObservation, b: PriceObservation) =>
  a.date !== b.date ? a.date > b.date : a.recordedAt > b.recordedAt;

export function optimizeBasket(
  items: readonly BasketItem[],
  observations: readonly PriceObservation[],
  options: BasketOptions,
): BasketResult {
  const linked = items.filter((i) => i.productCode && i.packs > 0);
  const unlinkedItemIds = items.filter((i) => !i.productCode).map((i) => i.id);
  const codes = new Set(linked.map((i) => i.productCode!));

  // Pro Geschäft und Produkt die jüngste belegte Beobachtung
  const latest = new Map<string, Map<string, PriceObservation>>();
  const labels = new Map<string, string>();
  const locations = new Map<string, Set<string>>();
  for (const o of observations) {
    if (!o.productCode || !codes.has(o.productCode) || o.pricePer !== "item" || o.currency !== "EUR") continue;
    const { key, label } = storeKey(o, options.groupBy);
    labels.set(key, label);
    locations.set(key, (locations.get(key) ?? new Set()).add(String(o.store.locationId ?? o.store.name)));
    const perStore = latest.get(key) ?? new Map<string, PriceObservation>();
    const prev = perStore.get(o.productCode);
    if (!prev || newer(o, prev)) perStore.set(o.productCode, o);
    latest.set(key, perStore);
  }

  const lineFor = (item: BasketItem, key: string): StoreLine | null => {
    const o = latest.get(key)?.get(item.productCode!);
    if (!o) return null;
    return { itemId: item.id, unitCents: o.priceCents, totalCents: multiplyCents(o.priceCents, item.packs), date: o.date, observationId: o.id, storeKey: key };
  };

  const stores: StoreBasket[] = [...latest.keys()].map((key) => {
    const lines = linked.map((i) => lineFor(i, key)).filter((l): l is StoreLine => l !== null);
    const covered = new Set(lines.map((l) => l.itemId));
    return {
      key,
      label: labels.get(key)!,
      locations: locations.get(key)?.size ?? 0,
      lines,
      missingItemIds: [...linked.filter((i) => !covered.has(i.id)).map((i) => i.id), ...unlinkedItemIds],
      subtotalCents: sumCents(lines.map((l) => l.totalCents)),
      oldestDate: lines.length ? lines.map((l) => l.date).sort()[0] : null,
    };
  });

  const byCoverageThenPrice = (a: { lines: unknown[]; subtotalCents: number }, b: { lines: unknown[]; subtotalCents: number }) =>
    b.lines.length - a.lines.length || a.subtotalCents - b.subtotalCents;
  stores.sort(byCoverageThenPrice);

  const best = stores[0];
  const single = best ? { store: best, complete: linked.length > 0 && best.lines.length === linked.length } : null;

  let split: SplitBasket | null = null;
  if (single && stores.length > 1) {
    const candidates: SplitBasket[] = [];
    for (let a = 0; a < stores.length; a++) {
      for (let b = a + 1; b < stores.length; b++) {
        const pair: [string, string] = [stores[a].key, stores[b].key];
        const lines: StoreLine[] = [];
        for (const item of linked) {
          const la = lineFor(item, pair[0]);
          const lb = lineFor(item, pair[1]);
          const pick = la && lb ? (lb.totalCents < la.totalCents ? lb : la) : (la ?? lb);
          if (pick) lines.push(pick);
        }
        const covered = new Set(lines.map((l) => l.itemId));
        const singleLines = new Map(single.store.lines.map((l) => [l.itemId, l]));
        const compared = lines.filter((l) => singleLines.has(l.itemId));
        const savings = sumCents(compared.map((l) => singleLines.get(l.itemId)!.totalCents - l.totalCents));
        candidates.push({
          stores: pair,
          lines,
          missingItemIds: [...linked.filter((i) => !covered.has(i.id)).map((i) => i.id), ...unlinkedItemIds],
          subtotalCents: sumCents(lines.map((l) => l.totalCents)),
          savingsCents: savings,
          comparedItemIds: compared.map((l) => l.itemId),
          worthIt: savings >= options.minSavingsCents && savings > 0,
        });
      }
    }
    // Bevorzugt: höchste Abdeckung, dann größte belegte Ersparnis
    candidates.sort((x, y) => y.lines.length - x.lines.length || y.savingsCents - x.savingsCents);
    split = candidates[0] ?? null;
  }

  return { linkedCount: linked.length, unlinkedItemIds, stores, single, split };
}
