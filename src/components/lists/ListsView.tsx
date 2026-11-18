"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { computeListTotals } from "@/lib/list-totals";
import { formatCents, toCents } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { ShoppingListSchema, type ListItem, type ShoppingList } from "@/lib/store/schema";
import { todayIso, uid, updateData, useAppData, useHydrated } from "@/lib/store/local";
import { Notice } from "@/components/ui/Notice";
import { IconCheck, IconDownload, IconPlus, IconTrash, IconUpload } from "@/components/ui/icons";
import { BasketCompare } from "./BasketCompare";

export function ListsView() {
  const { t, locale, intl } = useI18n();
  const data = useAppData();
  const hydrated = useHydrated();
  const params = useSearchParams();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const selectedId = params.get("list") ?? data.lists[0]?.id ?? null;
  const list = data.lists.find((l) => l.id === selectedId) ?? data.lists[0] ?? null;
  const select = (id: string) => router.replace(`/${locale}/lists?list=${id}`, { scroll: false });

  function createList(kind: ShoppingList["kind"] = "shopping") {
    const now = new Date().toISOString();
    const id = uid();
    updateData((d) => ({ ...d, lists: [...d.lists, { id, name: kind === "pantry" ? t.lists.kinds.pantry : t.lists.defaultName, kind, createdAt: now, updatedAt: now, items: [] }] }));
    select(id);
  }

  async function importList(file: File) {
    try {
      const parsed = ShoppingListSchema.safeParse(JSON.parse(await file.text()));
      if (!parsed.success) throw new Error();
      const id = uid();
      updateData((d) => ({ ...d, lists: [...d.lists, { ...parsed.data, id, items: parsed.data.items.map((i) => ({ ...i, id: uid() })) }] }));
      select(id);
      setNotice({ tone: "success", text: t.lists.importDone });
    } catch {
      setNotice({ tone: "danger", text: t.lists.importError });
    }
  }

  if (!hydrated) return <div className="h-64 animate-pulse rounded-[var(--radius-panel)] bg-mist-strong" />;

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
      <aside className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => createList()}><IconPlus width={16} height={16} />{t.lists.newList}</button>
          <button className="btn btn-quiet btn-sm" onClick={() => fileRef.current?.click()}><IconUpload width={16} height={16} />{t.lists.import}</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden="true"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importList(f); e.target.value = ""; }} />
        </div>
        {data.lists.length > 0 && (
          <nav aria-label={t.lists.title}>
            <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
              {data.lists.map((l) => {
                const tot = computeListTotals(l.items);
                const active = l.id === list?.id;
                return (
                  <li key={l.id} className="shrink-0">
                    <button
                      onClick={() => select(l.id)}
                      aria-current={active ? "true" : undefined}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left ${active ? "border-pine bg-pine-tint" : "border-line bg-paper hover:border-ink-soft"}`}
                    >
                      <span className="block truncate font-semibold">{l.name}</span>
                      <span className="flex items-baseline justify-between gap-2 text-xs text-ink-soft">
                        <span>{t.lists.kinds[l.kind]}, {l.items.length}</span>
                        <span className="num font-semibold text-ink">{formatCents(tot.confirmedCents, intl)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </aside>

      <div className="min-w-0 space-y-4">
        {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
        {!list ? (
          <div className="panel p-6">
            <p className="text-ink-soft">{t.lists.empty}</p>
            <button className="btn btn-primary mt-4" onClick={() => createList()}>{t.lists.newList}</button>
          </div>
        ) : (
          <ListDetail key={list.id} list={list} onDeleted={() => router.replace(`/${locale}/lists`)} onNotice={setNotice} />
        )}
      </div>
    </div>
  );
}

function ListDetail({ list, onDeleted, onNotice }: { list: ShoppingList; onDeleted: () => void; onNotice: (n: { tone: "success" | "danger"; text: string }) => void }) {
  const { t, intl } = useI18n();
  const totals = computeListTotals(list.items);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [priceError, setPriceError] = useState(false);

  const patchList = (fn: (l: ShoppingList) => ShoppingList) =>
    updateData((d) => ({ ...d, lists: d.lists.map((l) => (l.id === list.id ? { ...fn(l), updatedAt: new Date().toISOString() } : l)) }));
  const patchItem = (id: string, patch: Partial<ListItem>) => patchList((l) => ({ ...l, items: l.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));

  function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const cents = price.trim() ? toCents(price) : null;
    if (price.trim() && (cents === null || cents < 0)) return setPriceError(true);
    setPriceError(false);
    const item: ListItem = {
      id: uid(), name: name.trim(), quantity: Math.max(0.01, Number(qty.replace(",", ".")) || 1), category: category.trim(),
      priceCents: cents, priceSource: cents !== null ? "manual" : null, priceDate: cents !== null ? todayIso() : null, priceStore: null,
      productCode: null, quantityText: null, checked: false,
    };
    patchList((l) => ({ ...l, items: [...l.items, item] }));
    setName(""); setQty("1"); setPrice("");
  }

  const groups = useMemo(() => {
    const map = new Map<string, ListItem[]>();
    for (const i of list.items) map.set(i.category, [...(map.get(i.category) ?? []), i]);
    return [...map.entries()].sort(([a], [b]) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b)));
  }, [list.items]);
  const categories = [...new Set(list.items.map((i) => i.category).filter(Boolean))];

  function exportList() {
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `preispilot-${list.name.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function bookToBudget() {
    updateData((d) => ({
      ...d,
      purchases: [...d.purchases, { id: uid(), date: todayIso(), store: list.name, amountCents: totals.confirmedCents, kind: "planned", category: null, member: null, note: list.name, source: "list" }],
    }));
    onNotice({ tone: "success", text: t.lists.bookedToBudget });
  }

  return (
    <>
      <section className="panel p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <label htmlFor="list-name" className="sr-only">{t.lists.rename}</label>
            <input id="list-name" className="w-full bg-transparent text-[1.5rem] font-bold outline-none focus-visible:underline" defaultValue={list.name}
              onBlur={(e) => e.target.value.trim() && e.target.value !== list.name && patchList((l) => ({ ...l, name: e.target.value.trim().slice(0, 60) }))} />
            <label className="mt-1 inline-flex items-center gap-2 text-sm text-ink-soft">
              <span className="sr-only">{t.common.category}</span>
              <select className="rounded-md bg-transparent py-0.5 font-medium" value={list.kind} onChange={(e) => patchList((l) => ({ ...l, kind: e.target.value as ShoppingList["kind"] }))}>
                {(["shopping", "recurring", "pantry"] as const).map((k) => <option key={k} value={k}>{t.lists.kinds[k]}</option>)}
              </select>
            </label>
          </div>
          <div className="text-right">
            <p className="text-sm text-ink-soft">{t.lists.totalConfirmed}</p>
            <p className="price text-[2.6rem]" aria-live="polite">{formatCents(totals.confirmedCents, intl)}</p>
            <p className={`text-sm ${totals.complete ? "text-pine-strong" : "text-slate"}`}>
              {totals.complete ? t.lists.complete : list.items.length ? fmt(t.lists.missing, { n: totals.missingCount }) : ""}
            </p>
            {totals.checkedCents > 0 && <p className="num text-sm text-ink-soft">{t.lists.inCart}: {formatCents(totals.checkedCents, intl)}</p>}
          </div>
        </div>

        <form onSubmit={addItem} className="mt-5 grid gap-2 sm:grid-cols-[1fr_5rem_8rem_9rem_auto]">
          <div>
            <label className="sr-only" htmlFor="li-name">{t.common.name}</label>
            <input id="li-name" className="field" placeholder={t.lists.itemPlaceholder} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
          </div>
          <div>
            <label className="sr-only" htmlFor="li-qty">{t.common.quantity}</label>
            <input id="li-qty" className="field num" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} aria-label={t.common.quantity} />
          </div>
          <div>
            <label className="sr-only" htmlFor="li-price">{t.lists.pricePlaceholder}</label>
            <input id="li-price" className="field num" inputMode="decimal" placeholder={t.lists.pricePlaceholder} value={price} onChange={(e) => { setPrice(e.target.value); setPriceError(false); }} aria-invalid={priceError} />
          </div>
          <div>
            <label className="sr-only" htmlFor="li-cat">{t.common.category}</label>
            <input id="li-cat" className="field" list="li-cats" placeholder={t.lists.categoryPlaceholder} value={category} onChange={(e) => setCategory(e.target.value)} maxLength={40} />
            <datalist id="li-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <button className="btn btn-primary" type="submit"><IconPlus width={18} height={18} /><span className="sm:sr-only">{t.lists.addItem}</span></button>
        </form>
        {priceError && <p className="mt-2 text-sm text-danger">{t.lists.priceInvalid}</p>}
      </section>

      {list.items.length === 0 ? (
        <p className="panel p-5 text-ink-soft">{t.lists.emptyList}</p>
      ) : (
        <section className="panel divide-y divide-line">
          {groups.map(([cat, items]) => (
            <div key={cat || "_"}>
              {cat && <h3 className="bg-mist px-4 py-1.5 text-sm font-semibold text-ink-soft">{cat}</h3>}
              <ul className="divide-y divide-line">
                {items.map((i) => <ItemRow key={i.id} item={i} onPatch={(p) => patchItem(i.id, p)} onDelete={() => patchList((l) => ({ ...l, items: l.items.filter((x) => x.id !== i.id) }))} />)}
              </ul>
            </div>
          ))}
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        {list.items.some((i) => i.checked) && (
          <button className="btn btn-quiet btn-sm" onClick={() => patchList((l) => ({ ...l, items: l.items.map((i) => ({ ...i, checked: false })) }))}>{t.lists.uncheckAll}</button>
        )}
        {totals.confirmedCents > 0 && <button className="btn btn-quiet btn-sm" onClick={bookToBudget}>{t.lists.toBudget}</button>}
        <button className="btn btn-quiet btn-sm" onClick={() => {
          const now = new Date().toISOString(); const id = uid();
          updateData((d) => ({ ...d, lists: [...d.lists, { ...list, id, name: `${list.name} (2)`.slice(0, 60), createdAt: now, updatedAt: now, items: list.items.map((i) => ({ ...i, id: uid(), checked: false })) }] }));
        }}>{t.lists.duplicate}</button>
        <button className="btn btn-quiet btn-sm" onClick={exportList}><IconDownload width={16} height={16} />{t.lists.export}</button>
        <button className="btn btn-danger btn-sm" onClick={() => {
          if (!window.confirm(fmt(t.lists.confirmDelete, { name: list.name }))) return;
          updateData((d) => ({ ...d, lists: d.lists.filter((l) => l.id !== list.id) }));
          onDeleted();
        }}><IconTrash width={16} height={16} />{t.lists.deleteList}</button>
      </div>

      <BasketCompare list={list} onApplyPrice={(itemId, patch) => patchItem(itemId, patch)} />
    </>
  );
}

function ItemRow({ item, onPatch, onDelete }: { item: ListItem; onPatch: (p: Partial<ListItem>) => void; onDelete: () => void }) {
  const { t, intl } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.priceCents !== null ? (item.priceCents / 100).toFixed(2).replace(".", ",") : "");
  const lineTotal = item.priceCents !== null ? Math.round(item.priceCents * item.quantity) : null;

  return (
    <li className={`flex items-center gap-3 px-4 py-3 ${item.checked ? "opacity-60" : ""}`}>
      <button
        role="checkbox"
        aria-checked={item.checked}
        aria-label={`${t.lists.inCart}: ${item.name}`}
        onClick={() => onPatch({ checked: !item.checked })}
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border-2 ${item.checked ? "border-pine bg-pine text-on-pine" : "border-line bg-paper"}`}
      >
        {item.checked && <IconCheck width={16} height={16} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${item.checked ? "line-through" : ""}`}>{item.name}</p>
        <p className="text-xs text-ink-soft">
          {item.priceSource === "open_prices" && item.priceDate
            ? `${fmt(t.lists.fromData, { date: formatDate(item.priceDate, intl) })}${item.priceStore ? `, ${item.priceStore}` : ""}`
            : item.priceSource === "deal" && item.priceDate
              ? `${fmt(t.lists.fromDeal, { date: formatDate(item.priceDate.slice(0, 10), intl) })}${item.priceStore ? `, ${item.priceStore}` : ""}`
              : item.priceSource === "manual" ? t.lists.manualPrice : ""}
        </p>
      </div>
      <label className="sr-only" htmlFor={`q-${item.id}`}>{t.common.quantity}</label>
      <input id={`q-${item.id}`} className="field num !min-h-[38px] !w-16 !px-2 text-center" inputMode="decimal" defaultValue={String(item.quantity).replace(".", ",")}
        onBlur={(e) => { const v = Number(e.target.value.replace(",", ".")); if (v > 0 && v <= 999) onPatch({ quantity: v }); else e.target.value = String(item.quantity); }} />
      <div className="w-24 text-right sm:w-32">
        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); const c = draft.trim() ? toCents(draft) : null; if (draft.trim() && c === null) return; onPatch({ priceCents: c, priceSource: c !== null ? "manual" : null, priceDate: c !== null ? todayIso() : null, priceStore: null }); setEditing(false); }}>
            <label className="sr-only" htmlFor={`p-${item.id}`}>{t.lists.pricePlaceholder}</label>
            <input id={`p-${item.id}`} autoFocus className="field num !min-h-[38px] !px-2 text-right" inputMode="decimal" value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={(e) => e.currentTarget.form?.requestSubmit()} />
          </form>
        ) : (
          <button onClick={() => setEditing(true)} className="w-full text-right" aria-label={`${t.common.price}: ${item.name}`}>
            {lineTotal !== null ? <span className="num font-semibold">{formatCents(lineTotal, intl)}</span> : <span className="text-[0.78rem] leading-tight text-slate">{t.common.priceUnavailable}</span>}
          </button>
        )}
      </div>
      <button onClick={onDelete} className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-mist hover:text-danger" aria-label={`${t.common.delete}: ${item.name}`}>
        <IconTrash width={18} height={18} />
      </button>
    </li>
  );
}
