"use client";
import { useState, type FormEvent } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { HOUSEHOLD_CATEGORIES, checkPlan, goalProjection, type HouseholdCategory } from "@/lib/household";
import { formatCents, sumCents, toCents } from "@/lib/money";
import { monthlyCents, type SubCategory } from "@/lib/subscriptions";
import { formatMonth } from "@/lib/format";
import { todayIso, uid, updateData, useAppData } from "@/lib/store/local";
import type { AppData } from "@/lib/store/schema";
import { ProgressBar } from "@/components/charts/Charts";
import { Notice } from "@/components/ui/Notice";
import { IconPiggy, IconPlus, IconTrash } from "@/components/ui/icons";

const SUB_TO_HOUSEHOLD: Record<SubCategory, HouseholdCategory> = {
  video: "streaming", music: "streaming", media: "streaming", gaming: "gaming", cloud: "digital", software: "digital", productivity: "digital", other: "digital",
};

/** Ausgaben des laufenden Monats je Haushaltsbereich: bezahlte Einkäufe (über ihre Kategorie) + aktive Abos. */
export function householdSpent(data: AppData, labels: Record<HouseholdCategory, string>, today = todayIso()): Partial<Record<HouseholdCategory, number>> {
  const month = today.slice(0, 7);
  const lookup = new Map<string, HouseholdCategory>();
  for (const c of HOUSEHOLD_CATEGORIES) {
    lookup.set(c, c);
    lookup.set(labels[c].toLowerCase(), c);
  }
  const spent: Partial<Record<HouseholdCategory, number>> = {};
  const add = (c: HouseholdCategory, cents: number) => { spent[c] = (spent[c] ?? 0) + cents; };
  for (const p of data.purchases) {
    if (p.kind !== "paid" || !p.date.startsWith(month)) continue;
    add(lookup.get((p.category ?? "").trim().toLowerCase()) ?? "other", p.amountCents);
  }
  for (const s of data.subscriptions) if (s.status === "active") add(SUB_TO_HOUSEHOLD[s.category], monthlyCents(s));
  return spent;
}

export function HouseholdPlanner() {
  const { t, intl } = useI18n();
  const data = useAppData();
  const [editing, setEditing] = useState(false);
  const h = t.household;
  const fc = (c: number) => formatCents(c, intl);
  const plan = data.householdPlan;

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const allocations: Record<string, number> = {};
    for (const c of HOUSEHOLD_CATEGORIES) {
      const v = toCents(String(f.get(c) ?? "").trim() || "0");
      if (v) allocations[c] = v;
    }
    const total = toCents(String(f.get("total") ?? "")) ?? sumCents(Object.values(allocations));
    updateData((d) => ({ ...d, householdPlan: { totalCents: total, allocations } }));
    setEditing(false);
  }

  if (!plan && !editing) {
    return (
      <section aria-labelledby="hh-title" className="panel flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
        <div className="max-w-2xl">
          <h2 id="hh-title" className="text-lg font-bold">{h.title}</h2>
          <p className="mt-1 text-ink-soft">{h.intro}</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing(true)}><IconPlus width={16} height={16} />{h.create}</button>
      </section>
    );
  }

  if (editing) {
    return (
      <form onSubmit={save} className="panel space-y-4 p-4 sm:p-5" aria-labelledby="hh-title">
        <h2 id="hh-title" className="text-lg font-bold">{h.title}</h2>
        <div className="max-w-xs">
          <label className="label" htmlFor="hh-total">{h.total}</label>
          <input id="hh-total" name="total" className="field num" required inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,2})?"
            defaultValue={plan ? (plan.totalCents / 100).toFixed(2) : ""} />
        </div>
        <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <legend className="mb-2 font-semibold sm:col-span-2 lg:col-span-4">{h.allocation}</legend>
          {HOUSEHOLD_CATEGORIES.map((c) => (
            <div key={c}>
              <label className="label" htmlFor={`hh-${c}`}>{h.categories[c]}</label>
              <input id={`hh-${c}`} name={c} className="field num" inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,2})?"
                defaultValue={plan?.allocations[c] ? (plan.allocations[c]! / 100).toFixed(2) : ""} />
            </div>
          ))}
        </fieldset>
        <p className="text-sm text-ink-soft">{h.mapping}</p>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary">{h.save}</button>
          <button type="button" className="btn btn-quiet" onClick={() => setEditing(false)}>{t.common.cancel}</button>
        </div>
      </form>
    );
  }

  const check = checkPlan({ totalCents: plan!.totalCents, allocations: plan!.allocations }, householdSpent(data, h.categories));
  return (
    <section aria-labelledby="hh-title" className="panel space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="hh-title" className="text-lg font-bold">{h.title} · {formatMonth(todayIso().slice(0, 7), intl)}</h2>
          <p className="num text-ink-soft">{fc(plan!.totalCents)}</p>
        </div>
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => setEditing(true)}>{h.edit}</button>
      </div>
      {check.overAllocated && <Notice tone="warn">{fmt(h.overAllocated, { amount: fc(-check.unallocatedCents) })}</Notice>}
      {!check.overAllocated && check.unallocatedCents > 0 && <p className="text-sm text-ink-soft">{fmt(h.unallocated, { amount: fc(check.unallocatedCents) })}</p>}
      <ul className="grid gap-4 md:grid-cols-2">
        {check.perCategory.map((c) => (
          <li key={c.category} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{h.categories[c.category]}</span>
              <span className="num text-sm text-ink-soft">{fc(c.spentCents)} {t.common.of} {fc(c.allocatedCents)}</span>
            </div>
            <ProgressBar value={c.spentCents} max={Math.max(c.allocatedCents, 1)} level={c.level} label={h.categories[c.category]} />
            <p className={`text-sm ${c.level === "over" ? "font-semibold text-danger" : c.level === "warn" ? "text-saffron-text" : "text-ink-soft"}`}>
              {c.level === "over"
                ? fmt(h.over, { amount: fc(-c.remainingCents) })
                : c.level === "warn"
                  ? fmt(h.warn, { pct: Math.round((c.spentCents / Math.max(c.allocatedCents, 1)) * 100) })
                  : `${fc(c.remainingCents)} ${h.remaining}`}
            </p>
          </li>
        ))}
      </ul>
      <p className="text-sm text-ink-soft">{h.mapping}</p>
    </section>
  );
}

export function SavingsGoals() {
  const { t, intl } = useI18n();
  const data = useAppData();
  const [adding, setAdding] = useState(false);
  const [depositFor, setDepositFor] = useState<string | null>(null);
  const h = t.household;
  const fc = (c: number) => formatCents(c, intl);

  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const target = toCents(String(f.get("target") ?? ""));
    if (!target) return;
    updateData((d) => ({
      ...d,
      savingsGoals: [
        ...d.savingsGoals,
        {
          id: uid(),
          name: String(f.get("name") ?? "").trim(),
          targetCents: target,
          savedCents: toCents(String(f.get("saved") ?? "").trim() || "0") ?? 0,
          monthlyCents: toCents(String(f.get("monthly") ?? "").trim() || "0") ?? 0,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setAdding(false);
  }
  function deposit(e: FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    const cents = toCents(String(new FormData(e.currentTarget).get("amount") ?? ""));
    if (!cents) return;
    updateData((d) => ({ ...d, savingsGoals: d.savingsGoals.map((g) => (g.id === id ? { ...g, savedCents: g.savedCents + cents } : g)) }));
    setDepositFor(null);
  }

  const moneyInput = { className: "field num", inputMode: "decimal" as const, pattern: "[0-9]+([.,][0-9]{1,2})?" };
  return (
    <section aria-labelledby="goals-title" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="goals-title" className="flex items-center gap-2 text-lg font-bold"><IconPiggy width={20} height={20} />{h.goals}</h2>
          <p className="text-sm text-ink-soft">{h.goalsIntro}</p>
        </div>
        <button type="button" className="btn btn-quiet btn-sm" aria-expanded={adding} onClick={() => setAdding(!adding)}><IconPlus width={16} height={16} />{h.addGoal}</button>
      </div>
      {adding && (
        <form onSubmit={add} className="panel grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><label className="label" htmlFor="g-name">{h.goalName}</label><input id="g-name" name="name" className="field" required maxLength={60} /></div>
          <div><label className="label" htmlFor="g-target">{h.target}</label><input id="g-target" name="target" required {...moneyInput} /></div>
          <div><label className="label" htmlFor="g-saved">{h.savedAmount}</label><input id="g-saved" name="saved" {...moneyInput} /></div>
          <div><label className="label" htmlFor="g-monthly">{h.monthly}</label><input id="g-monthly" name="monthly" {...moneyInput} /></div>
          <div className="sm:col-span-2 lg:col-span-4"><button type="submit" className="btn btn-primary btn-sm">{t.common.save}</button></div>
        </form>
      )}
      {!data.savingsGoals.length && !adding && <p className="text-ink-soft">{h.noGoals}</p>}
      <ul className="grid gap-4 md:grid-cols-2">
        {data.savingsGoals.map((g) => {
          const pr = goalProjection(g);
          return (
            <li key={g.id} className="panel space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{g.name}</p>
                  <p className="num text-sm text-ink-soft">{fc(g.savedCents)} {t.common.of} {fc(g.targetCents)}</p>
                </div>
                <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-mist hover:text-danger" aria-label={`${h.deleteGoal}: ${g.name}`}
                  onClick={() => updateData((d) => ({ ...d, savingsGoals: d.savingsGoals.filter((x) => x.id !== g.id) }))}>
                  <IconTrash width={16} height={16} />
                </button>
              </div>
              <ProgressBar value={g.savedCents} max={g.targetCents} level="ok" label={g.name} />
              <p className="text-sm">
                {pr.reached ? <span className="font-semibold text-pine-strong">{h.reached}</span>
                  : pr.date ? fmt(h.eta, { date: formatMonth(pr.date, intl), n: pr.months! })
                  : <span className="text-ink-soft">{h.noEta}</span>}
              </p>
              {depositFor === g.id ? (
                <form onSubmit={(e) => deposit(e, g.id)} className="flex flex-wrap items-end gap-2">
                  <div><label className="label" htmlFor={`dep-${g.id}`}>{h.depositPrompt}</label><input id={`dep-${g.id}`} name="amount" required {...moneyInput} className="field num w-32" /></div>
                  <button type="submit" className="btn btn-primary btn-sm">{t.common.save}</button>
                </form>
              ) : (
                !pr.reached && <button type="button" className="btn btn-quiet btn-sm" onClick={() => setDepositFor(g.id)}>{h.deposit}</button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
