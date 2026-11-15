"use client";
import { useState, type FormEvent } from "react";
import { fmt } from "@/i18n";
import { formatDate } from "@/lib/format";
import { toCents } from "@/lib/money";
import {
  monthlyCents, nextPayment, savingsCheck, subscriptionTotals, termInfo, yearlyCents,
  type Cycle, type SubCategory, type Subscription, type Usage,
} from "@/lib/subscriptions";
import { todayIso, uid, updateData, useAppData, useHydrated } from "@/lib/store/local";
import { Notice } from "@/components/ui/Notice";
import { IconPiggy, IconPlus, IconTrash } from "@/components/ui/icons";
import { useMedia } from "./shared";
import { TitleSearch } from "./LiveSearch";

const CATS: SubCategory[] = ["video", "music", "gaming", "cloud", "software", "productivity", "media", "other"];
const CYCLES: Cycle[] = ["monthly", "yearly", "quarterly", "weekly"];
const USAGES: Usage[] = ["often", "sometimes", "rarely", "never"];

export function AbosView() {
  const { t, money } = useMedia();
  const data = useAppData();
  const hydrated = useHydrated();
  const [adding, setAdding] = useState(false);
  if (!hydrated) return <div className="h-64 animate-pulse rounded-[var(--radius-panel)] bg-mist-strong" />;

  const subs = data.subscriptions;
  const totals = subscriptionTotals(subs);
  const tips = savingsCheck(subs);
  const byId = new Map(subs.map((s) => [s.id, s]));
  const sorted = [...subs].sort((a, b) => (a.status === b.status ? monthlyCents(b) - monthlyCents(a) : a.status === "active" ? -1 : 1));

  return (
    <div className="space-y-8">
      <dl className="grid gap-px overflow-hidden rounded-[var(--radius-panel)] border border-line bg-line sm:grid-cols-3">
        <div className="bg-paper p-5">
          <dt className="text-sm text-ink-soft">{t.abos.monthly}</dt>
          <dd className="price mt-1 text-4xl">{money(totals.monthlyCents)}</dd>
        </div>
        <div className="bg-paper p-5">
          <dt className="text-sm text-ink-soft">{t.abos.yearly}</dt>
          <dd className="price mt-1 text-4xl">{money(totals.yearlyCents)}</dd>
        </div>
        <div className="bg-paper p-5">
          <dt className="text-sm text-ink-soft">{t.abos.active}</dt>
          <dd className="price mt-1 text-4xl">{totals.activeCount}</dd>
        </div>
      </dl>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="abo-list" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="abo-list" className="text-lg font-bold">{t.nav.abos}</h2>
            <button type="button" className="btn btn-primary btn-sm" aria-expanded={adding} onClick={() => setAdding(!adding)}>
              <IconPlus width={16} height={16} />{t.abos.add}
            </button>
          </div>
          {adding && <AboForm onDone={() => setAdding(false)} />}
          {!subs.length && !adding && <p className="panel p-5 text-ink-soft">{t.abos.empty}</p>}
          <ul className="space-y-3">
            {sorted.map((s) => <AboCard key={s.id} sub={s} />)}
          </ul>
          <p className="text-sm text-ink-soft">{t.abos.budgetNote}</p>
        </section>

        <section aria-labelledby="abo-tips" className="panel h-fit p-4 sm:p-5">
          <h2 id="abo-tips" className="flex items-center gap-2 text-lg font-bold"><IconPiggy width={20} height={20} />{t.abos.savingsTitle}</h2>
          {!tips.length ? (
            <p className="mt-2 text-ink-soft">{t.abos.noTips}</p>
          ) : (
            <ul className="mt-3 space-y-3 text-[0.95rem]">
              {tips.map((tip, i) => {
                const name = "id" in tip ? (byId.get(tip.id)?.name ?? "") : "";
                let text = "";
                if (tip.kind === "duplicate") text = fmt(t.abos.tips.duplicate, { n: tip.ids.length, category: t.abos.categories[tip.category], amount: money(tip.yearlyCents) });
                if (tip.kind === "yearly_cheaper") text = fmt(t.abos.tips.yearly_cheaper, { name, amount: money(tip.savingCents) });
                if (tip.kind === "unused") text = fmt(t.abos.tips.unused, { name, amount: money(tip.yearlyCents) });
                if (tip.kind === "family") text = fmt(t.abos.tips.family, { name, amount: money(tip.savingCents) });
                if (tip.kind === "price_increase") text = fmt(t.abos.tips.price_increase, { name, from: money(tip.fromCents), to: money(tip.toCents), pct: tip.percent });
                return <li key={i} className="border-l-2 border-pine pl-3">{text}</li>;
              })}
            </ul>
          )}
        </section>
      </div>
      <TitleSearch />
    </div>
  );
}

function AboCard({ sub }: { sub: Subscription }) {
  const { t, intl, money } = useMedia();
  const [mode, setMode] = useState<"none" | "cancel" | "price">("none");
  const next = nextPayment(sub);
  const term = sub.status === "active" ? termInfo(sub) : null;
  const update = (patch: (s: Subscription) => Subscription) =>
    updateData((d) => ({ ...d, subscriptions: d.subscriptions.map((x) => (x.id === sub.id ? patch(x) : x)) }));

  function cancel(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const endsOn = String(new FormData(e.currentTarget).get("endsOn") ?? "");
    update((s) => ({ ...s, status: "cancelled", endsOn: endsOn || null }));
    setMode("none");
  }
  function newPrice(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cents = toCents(String(new FormData(e.currentTarget).get("price") ?? ""));
    if (cents === null) return;
    update((s) => ({
      ...s,
      priceCents: cents,
      priceHistory: [...(s.priceHistory.length ? s.priceHistory : [{ date: s.startDate, priceCents: s.priceCents }]), { date: todayIso(), priceCents: cents }],
    }));
    setMode("none");
  }

  return (
    <li className={`panel p-4 ${sub.status === "cancelled" ? "opacity-75" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-bold">
            {sub.name}
            <span className="chip border border-line font-medium text-ink-soft">{t.abos.categories[sub.category]}</span>
            {sub.status === "cancelled" && <span className="chip bg-mist-strong text-ink-soft">{t.abos.cancelled}</span>}
          </p>
          <p className="num mt-0.5 text-sm text-ink-soft">
            {money(sub.priceCents)} {t.abos.cycles[sub.cycle]} · {money(monthlyCents(sub))} {t.abos.monthly} · {money(yearlyCents(sub))} {t.abos.yearly}
          </p>
        </div>
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-mist-strong hover:text-danger"
          aria-label={`${t.abos.delete}: ${sub.name}`}
          onClick={() => updateData((d) => ({ ...d, subscriptions: d.subscriptions.filter((x) => x.id !== sub.id) }))}
        >
          <IconTrash width={16} height={16} />
        </button>
      </div>
      <ul className="mt-2 space-y-0.5 text-[0.95rem]">
        {next && <li>{fmt(t.abos.nextPayment, { date: formatDate(next, intl) })}</li>}
        {sub.status === "cancelled" && sub.endsOn && <li>{fmt(t.abos.endsOn, { date: formatDate(sub.endsOn, intl) })}</li>}
        {term && term.known && (
          <li className={term.daysLeft <= 14 ? "font-semibold text-saffron-text" : ""}>
            {fmt(t.abos.cancelBy, { date: formatDate(term.cancelBy, intl), n: term.daysLeft })}
          </li>
        )}
        {term && !term.known && (
          <li className="text-ink-soft">{fmt(t.abos.termUnknown, { fields: term.missing.map((m) => t.abos.missing[m]).join(", ") })}</li>
        )}
      </ul>
      {sub.status === "active" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn btn-quiet btn-sm" aria-expanded={mode === "price"} onClick={() => setMode(mode === "price" ? "none" : "price")}>{t.abos.newPrice}</button>
          <button type="button" className="btn btn-quiet btn-sm" aria-expanded={mode === "cancel"} onClick={() => setMode(mode === "cancel" ? "none" : "cancel")}>{t.abos.markCancelled}</button>
        </div>
      )}
      {mode === "price" && (
        <form onSubmit={newPrice} className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="label" htmlFor={`np-${sub.id}`}>{t.abos.newPricePrompt}</label>
            <input id={`np-${sub.id}`} name="price" className="field num w-36" required inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,2})?" />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">{t.product.save}</button>
        </form>
      )}
      {mode === "cancel" && (
        <form onSubmit={cancel} className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="label" htmlFor={`end-${sub.id}`}>{t.abos.endsOnPrompt}</label>
            <input id={`end-${sub.id}`} name="endsOn" className="field w-48" type="date" />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">{t.product.save}</button>
        </form>
      )}
    </li>
  );
}

function AboForm({ onDone }: { onDone: () => void }) {
  const { t } = useMedia();
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const num = (k: string) => {
      const raw = String(f.get(k) ?? "").trim();
      return raw === "" ? null : Math.max(0, Math.round(Number(raw)));
    };
    const money = (k: string) => {
      const raw = String(f.get(k) ?? "").trim();
      return raw === "" ? null : toCents(raw);
    };
    const price = money("price");
    if (price === null) {
      setError(t.abos.price);
      return;
    }
    const noticeValue = num("noticeValue");
    const familyPrice = money("familyPrice");
    const people = num("familyPeople");
    const usage = String(f.get("usage") ?? "");
    const sub: Subscription = {
      id: uid(),
      name: String(f.get("name") ?? "").trim(),
      category: String(f.get("category")) as SubCategory,
      priceCents: price,
      cycle: String(f.get("cycle")) as Cycle,
      startDate: String(f.get("start") ?? todayIso()),
      minTermMonths: num("minTerm"),
      renewalMonths: num("renewal"),
      notice: noticeValue === null ? null : { value: noticeValue, unit: String(f.get("noticeUnit")) as "days" | "weeks" | "months" },
      status: "active",
      endsOn: null,
      usage: usage ? (usage as Usage) : null,
      yearlyOptionCents: money("yearlyOption"),
      familyOption: familyPrice !== null && people ? { priceCents: familyPrice, people } : null,
      priceHistory: [],
    };
    const res = updateData((d) => ({ ...d, subscriptions: [...d.subscriptions, sub] }));
    if (!res.ok) setError(res.error);
    else onDone();
  }

  const moneyField = { inputMode: "decimal" as const, pattern: "[0-9]+([.,][0-9]{1,2})?", className: "field num" };
  return (
    <form onSubmit={submit} className="panel space-y-5 p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="ab-name">{t.abos.name}</label>
          <input id="ab-name" name="name" className="field" required maxLength={60} />
        </div>
        <div>
          <label className="label" htmlFor="ab-cat">{t.abos.category}</label>
          <select id="ab-cat" name="category" className="field" defaultValue="video">
            {CATS.map((c) => <option key={c} value={c}>{t.abos.categories[c]}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="ab-price">{t.abos.price}</label>
          <input id="ab-price" name="price" required {...moneyField} />
        </div>
        <div>
          <label className="label" htmlFor="ab-cycle">{t.abos.cycle}</label>
          <select id="ab-cycle" name="cycle" className="field" defaultValue="monthly">
            {CYCLES.map((c) => <option key={c} value={c}>{t.abos.cycles[c]}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="ab-start">{t.abos.start}</label>
          <input id="ab-start" name="start" className="field" type="date" required defaultValue={todayIso()} />
        </div>
        <div>
          <label className="label" htmlFor="ab-usage">{t.abos.usage}</label>
          <select id="ab-usage" name="usage" className="field" defaultValue="">
            <option value="">–</option>
            {USAGES.map((u) => <option key={u} value={u}>{t.abos.usages[u]}</option>)}
          </select>
        </div>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-1 font-bold sm:col-span-3">{t.abos.notice}</legend>
        <div>
          <label className="label" htmlFor="ab-min">{t.abos.minTerm}</label>
          <input id="ab-min" name="minTerm" className="field num" type="number" min={0} max={60} />
        </div>
        <div>
          <label className="label" htmlFor="ab-renew">{t.abos.renewal}</label>
          <input id="ab-renew" name="renewal" className="field num" type="number" min={0} max={60} />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="label" htmlFor="ab-notice">{t.abos.notice}</label>
            <input id="ab-notice" name="noticeValue" className="field num" type="number" min={0} max={365} />
          </div>
          <div className="w-32">
            <label className="label" htmlFor="ab-unit"><span className="sr-only">{t.abos.notice}</span>&nbsp;</label>
            <select id="ab-unit" name="noticeUnit" className="field" defaultValue="months">
              {(["days", "weeks", "months"] as const).map((u) => <option key={u} value={u}>{t.abos.noticeUnits[u]}</option>)}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-1 font-bold sm:col-span-3">{t.abos.optional}</legend>
        <div>
          <label className="label" htmlFor="ab-yearly">{t.abos.yearlyOption}</label>
          <input id="ab-yearly" name="yearlyOption" {...moneyField} />
        </div>
        <div>
          <label className="label" htmlFor="ab-fam">{t.abos.familyPrice}</label>
          <input id="ab-fam" name="familyPrice" {...moneyField} />
        </div>
        <div>
          <label className="label" htmlFor="ab-people">{t.abos.familyPeople}</label>
          <input id="ab-people" name="familyPeople" className="field num" type="number" min={1} max={20} />
        </div>
      </fieldset>
      {error && <Notice tone="danger">{error}</Notice>}
      <button type="submit" className="btn btn-primary">{t.product.save}</button>
    </form>
  );
}
