"use client";
import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { budgetStatus, findDuplicatePurchase, monthlyTotals, type Budget, type CostKind, type Purchase } from "@/lib/budget";
import { formatCents, toCents } from "@/lib/money";
import { formatDate, formatMonth } from "@/lib/format";
import { todayIso, uid, updateData, useAppData, useHydrated } from "@/lib/store/local";
import { BarChart, ProgressBar } from "@/components/charts/Charts";
import { Notice } from "@/components/ui/Notice";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import { HouseholdPlanner, SavingsGoals } from "./Household";
import { HOUSEHOLD_CATEGORIES } from "@/lib/household";

export function BudgetView() {
  const { t, intl } = useI18n();
  const data = useAppData();
  const hydrated = useHydrated();
  const [showNew, setShowNew] = useState(false);
  if (!hydrated) return <div className="h-64 animate-pulse rounded-[var(--radius-panel)] bg-mist-strong" />;

  const months = monthlyTotals(data.purchases, 6);
  const currentMonth = months[months.length - 1]?.month;
  const categories = [...new Set([...HOUSEHOLD_CATEGORIES.map((c) => t.household.categories[c]), ...data.purchases.map((p) => p.category), ...data.budgets.map((b) => b.category)].filter((c): c is string => !!c))];
  const members = [...new Set([...data.purchases.map((p) => p.member), ...data.budgets.map((b) => b.member)].filter((c): c is string => !!c))];

  return (
    <div className="space-y-8">
      <p className="prose-narrow -mt-4 text-ink-soft">{t.budget.intro}</p>
      <datalist id="bud-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
      <datalist id="bud-members">{members.map((c) => <option key={c} value={c} />)}</datalist>
      <HouseholdPlanner />

      <section aria-labelledby="budgets-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="budgets-title" className="sr-only">{t.budget.title}</h2>
          {!data.budgets.length && !showNew && <p className="text-ink-soft">{t.budget.empty}</p>}
          <button className="btn btn-primary btn-sm ml-auto" aria-expanded={showNew} onClick={() => setShowNew(!showNew)}><IconPlus width={16} height={16} />{t.budget.newBudget}</button>
        </div>
        {showNew && <NewBudget onDone={() => setShowNew(false)} />}
        <div className="grid gap-4 md:grid-cols-2">
          {data.budgets.map((b) => <BudgetCard key={b.id} budget={b} purchases={data.purchases} />)}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <PurchaseForm existing={data.purchases} />
        <section aria-labelledby="months-title" className="panel p-4 sm:p-5">
          <h2 id="months-title" className="mb-4 text-lg font-bold">{t.budget.months}</h2>
          <BarChart
            label={t.budget.months}
            data={months.map((m) => ({ label: formatMonth(m.month, intl), value: m.paidCents, highlight: m.month === currentMonth }))}
            format={(v) => formatCents(v, intl).replace(/[,.]00(?=\s?€)/, "")}
          />
        </section>
      </div>

      <SavingsGoals />

      <section aria-labelledby="purchases-title">
        <h2 id="purchases-title" className="text-lg font-bold">{t.budget.purchases}</h2>
        {!data.purchases.length ? (
          <p className="mt-2 text-ink-soft">{t.budget.noPurchases}</p>
        ) : (
          <ul className="panel mt-3 divide-y divide-line">
            {[...data.purchases].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50).map((p) => (
              <li key={p.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-medium">{p.store || "–"}</span>
                    <span className="num shrink-0 font-semibold">{formatCents(p.amountCents, intl)}</span>
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-soft">
                    <span className="num">{formatDate(p.date, intl)}</span>
                    {p.category && <span>{p.category}</span>}
                    {p.member && <span>{p.member}</span>}
                    <KindChip kind={p.kind} />
                  </p>
                </div>
                <button className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-mist hover:text-danger" aria-label={`${t.common.delete}: ${p.store} ${formatDate(p.date, intl)}`}
                  onClick={() => updateData((d) => ({ ...d, purchases: d.purchases.filter((x) => x.id !== p.id) }))}>
                  <IconTrash width={16} height={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function KindChip({ kind }: { kind: CostKind }) {
  const { t } = useI18n();
  const cls = kind === "paid" ? "bg-pine-tint text-pine-strong" : kind === "estimated" ? "bg-saffron-tint text-saffron-text" : "border border-dashed border-line text-ink-soft";
  return <span className={`chip ${cls}`}>{t.budget[kind]}</span>;
}

function BudgetCard({ budget, purchases }: { budget: Budget; purchases: Purchase[] }) {
  const { t, intl } = useI18n();
  const s = budgetStatus(budget, purchases);
  const fc = (c: number) => formatCents(c, intl);
  return (
    <article className="panel p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{budget.name}</h3>
          <p className="text-sm text-ink-soft">
            {fc(budget.limitCents)} {t.budget.periods[budget.period]}
            {budget.category ? `, ${budget.category}` : ""}{budget.member ? `, ${budget.member}` : ""}
          </p>
          {s.range && <p className="text-xs text-ink-soft">{fmt(t.budget.range, { start: formatDate(s.range.start, intl), end: formatDate(s.range.end, intl) })}</p>}
          {budget.period === "purchase" && <p className="text-xs text-ink-soft">{t.budget.latestPurchase}</p>}
        </div>
        <button className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-mist hover:text-danger" aria-label={`${t.budget.deleteBudget}: ${budget.name}`}
          onClick={() => window.confirm(`${t.budget.deleteBudget}: ${budget.name}?`) && updateData((d) => ({ ...d, budgets: d.budgets.filter((b) => b.id !== budget.id) }))}>
          <IconTrash width={16} height={16} />
        </button>
      </div>
      <p className={`price mt-4 text-[2.6rem] ${s.remainingCents < 0 ? "text-danger" : ""}`}>{fc(Math.abs(s.remainingCents))}</p>
      <p className="mb-3 text-sm text-ink-soft">{s.remainingCents < 0 ? fmt(t.budget.overBy, { amount: fc(-s.remainingCents) }) : t.budget.remaining}</p>
      <ProgressBar value={s.paidCents} max={budget.limitCents} level={s.level} label={budget.name} />
      <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
        {(["paid", "estimated", "planned"] as const).map((k) => (
          <div key={k}>
            <dt className="text-ink-soft">{t.budget[k]}</dt>
            <dd className="num font-semibold">{fc(k === "paid" ? s.paidCents : k === "estimated" ? s.estimatedCents : s.plannedCents)}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 space-y-2">
        {s.level === "over" && <Notice tone="danger">{t.budget.over}</Notice>}
        {s.level === "warn" && <Notice tone="warn">{fmt(t.budget.warn, { pct: Math.round(s.usedPercent) })}</Notice>}
        {s.level !== "over" && s.projectedLevel === "over" && <Notice tone="warn">{t.budget.projectedOver}</Notice>}
      </div>
    </article>
  );
}

function NewBudget({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [name, setName] = useState(t.budget.defaultName);
  const [limit, setLimit] = useState("");
  const [period, setPeriod] = useState<Budget["period"]>("month");
  const [category, setCategory] = useState("");
  const [member, setMember] = useState("");
  const [warnAt, setWarnAt] = useState("80");
  const [error, setError] = useState(false);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const cents = toCents(limit);
    if (!cents || cents <= 0) return setError(true);
    updateData((d) => ({
      ...d,
      budgets: [...d.budgets, { id: uid(), name: name.trim() || t.budget.defaultName, period, limitCents: cents, category: category.trim() || null, member: member.trim() || null, warnAtPercent: Math.min(100, Math.max(1, Number(warnAt) || 80)) }],
    }));
    onDone();
  }

  return (
    <form onSubmit={save} className="panel grid gap-3 p-4 sm:grid-cols-3">
      <div><label className="label" htmlFor="nb-name">{t.budget.name}</label><input id="nb-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></div>
      <div>
        <label className="label" htmlFor="nb-limit">{t.budget.limit} (€)</label>
        <input id="nb-limit" className="field num" inputMode="decimal" value={limit} onChange={(e) => { setLimit(e.target.value); setError(false); }} required aria-invalid={error} placeholder="350" />
        {error && <p className="mt-1 text-sm text-danger">{t.lists.priceInvalid}</p>}
      </div>
      <div>
        <label className="label" htmlFor="nb-period">{t.budget.period}</label>
        <select id="nb-period" className="field" value={period} onChange={(e) => setPeriod(e.target.value as Budget["period"])}>
          {(["month", "week", "day", "purchase"] as const).map((p) => <option key={p} value={p}>{t.budget.periods[p]}</option>)}
        </select>
      </div>
      <div><label className="label" htmlFor="nb-cat">{t.common.category} ({t.common.optional})</label><input id="nb-cat" className="field" list="bud-cats" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t.budget.categoryAll} /></div>
      <div><label className="label" htmlFor="nb-member">{t.budget.member} ({t.common.optional})</label><input id="nb-member" className="field" list="bud-members" value={member} onChange={(e) => setMember(e.target.value)} /></div>
      <div><label className="label" htmlFor="nb-warn">{t.budget.warnAt} (%)</label><input id="nb-warn" className="field num" inputMode="numeric" value={warnAt} onChange={(e) => setWarnAt(e.target.value)} /></div>
      <div className="flex gap-2 sm:col-span-3">
        <button className="btn btn-primary" type="submit">{t.common.save}</button>
        <button className="btn btn-quiet" type="button" onClick={onDone}>{t.common.cancel}</button>
      </div>
    </form>
  );
}

function PurchaseForm({ existing }: { existing: Purchase[] }) {
  const { t, intl } = useI18n();
  const [date, setDate] = useState(todayIso());
  const [store, setStore] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<CostKind>("paid");
  const [category, setCategory] = useState("");
  const [member, setMember] = useState("");
  const [duplicate, setDuplicate] = useState<Purchase | null>(null);
  const [error, setError] = useState(false);
  const stores = [...new Set(existing.map((p) => p.store).filter(Boolean))];

  function book(force = false) {
    const cents = toCents(amount);
    if (cents === null || cents <= 0) return setError(true);
    const candidate: Omit<Purchase, "id"> = { date, store: store.trim(), amountCents: cents, kind, category: category.trim() || null, member: member.trim() || null, note: "", source: "manual" };
    const dup = findDuplicatePurchase(candidate, existing);
    if (dup && !force) return setDuplicate(dup);
    updateData((d) => ({ ...d, purchases: [...d.purchases, { ...candidate, id: uid() }] }));
    setDuplicate(null); setAmount(""); setError(false);
  }

  return (
    <section aria-labelledby="purchase-title" className="panel p-4 sm:p-5">
      <h2 id="purchase-title" className="mb-3 text-lg font-bold">{t.budget.addPurchase}</h2>
      <form onSubmit={(e) => { e.preventDefault(); book(); }} className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="pf-date">{t.common.date}</label><input id="pf-date" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} required max="2100-12-31" /></div>
        <div>
          <label className="label" htmlFor="pf-amount">{t.common.amount} (€)</label>
          <input id="pf-amount" className="field num" inputMode="decimal" value={amount} onChange={(e) => { setAmount(e.target.value); setError(false); setDuplicate(null); }} required aria-invalid={error} />
          {error && <p className="mt-1 text-sm text-danger">{t.lists.priceInvalid}</p>}
        </div>
        <div>
          <label className="label" htmlFor="pf-store">{t.common.store}</label>
          <input id="pf-store" className="field" list="pf-stores" value={store} onChange={(e) => { setStore(e.target.value); setDuplicate(null); }} maxLength={80} />
          <datalist id="pf-stores">{stores.map((s) => <option key={s} value={s} />)}</datalist>
        </div>
        <fieldset>
          <legend className="label">{t.budget.kind}</legend>
          <div className="flex gap-1 rounded-full border border-line p-1">
            {(["paid", "estimated", "planned"] as const).map((k) => (
              <label key={k} className={`flex-1 cursor-pointer rounded-full px-2 py-1.5 text-center text-sm font-semibold ${kind === k ? "bg-pine text-on-pine" : "text-ink-soft"}`}>
                <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
                {t.budget[k]}
              </label>
            ))}
          </div>
        </fieldset>
        <div><label className="label" htmlFor="pf-cat">{t.common.category}</label><input id="pf-cat" className="field" list="bud-cats" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={40} /></div>
        <div><label className="label" htmlFor="pf-member">{t.budget.member}</label><input id="pf-member" className="field" list="bud-members" value={member} onChange={(e) => setMember(e.target.value)} maxLength={40} /></div>
        <div className="sm:col-span-2"><button className="btn btn-primary w-full sm:w-auto" type="submit">{t.budget.addPurchase}</button></div>
      </form>
      {duplicate && (
        <div className="mt-3">
          <Notice tone="warn" action={<button className="btn btn-quiet btn-sm" onClick={() => book(true)}>{t.budget.bookAnyway}</button>}>
            {fmt(t.budget.duplicate, { store: duplicate.store || "–", amount: formatCents(duplicate.amountCents, intl), date: formatDate(duplicate.date, intl) })}
          </Notice>
        </div>
      )}
    </section>
  );
}
