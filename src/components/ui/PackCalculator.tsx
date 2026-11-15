"use client";
import { useId, useState } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { formatCents, formatUnitPrice, toCents } from "@/lib/money";
import { comparePacks, referenceUnit, toQuantity } from "@/lib/units";
import { unitLabel } from "@/lib/format";

type Unit = "g" | "kg" | "ml" | "l" | "stk";
interface Pack { price: string; amount: string; unit: Unit }

// Startwerte = Rechenbeispiel aus dem Auftrag (500 g für 2,49 € vs. 750 g für 3,29 €), keine Marktpreise.
const START: [Pack, Pack] = [
  { price: "2,49", amount: "500", unit: "g" },
  { price: "3,29", amount: "750", unit: "g" },
];

export function PackCalculator({ compact = false }: { compact?: boolean }) {
  const { t, intl } = useI18n();
  const [packs, setPacks] = useState<[Pack, Pack]>(START);
  const id = useId();

  const options = packs.map((p, i) => {
    const cents = toCents(p.price);
    const amount = Number(p.amount.replace(",", "."));
    return { id: String(i), priceCents: cents ?? -1, quantity: cents !== null ? toQuantity(amount, p.unit) : null };
  });
  const result = options.every((o) => o.priceCents >= 0 && o.quantity) ? comparePacks(options) : null;
  const unitName = (dim: "mass" | "volume" | "count") => {
    const r = referenceUnit(dim).label;
    return r === "piece" ? (t.common.perPiece.split(" ").pop() ?? "") : r;
  };

  const update = (i: 0 | 1, patch: Partial<Pack>) =>
    setPacks((prev) => {
      const next: [Pack, Pack] = [{ ...prev[0] }, { ...prev[1] }];
      next[i] = { ...next[i], ...patch };
      return next;
    });

  let verdict: string;
  if (!result) verdict = t.home.calcMissing;
  else if (!result.comparable) verdict = t.home.calcIncomparable;
  else if (result.spreadPercent < 0.05) verdict = t.home.calcEqual;
  else verdict = `${t.home.calcPack} ${result.cheapestId === "0" ? "A" : "B"}: ${fmt(t.home.calcSaves, { pct: result.spreadPercent.toLocaleString(intl, { maximumFractionDigits: 1 }) })}`;

  return (
    <section aria-labelledby={`${id}-title`} className="panel p-4 sm:p-5">
      {!compact && (
        <div className="mb-4">
          <h2 id={`${id}-title`} className="text-lg font-bold">{t.home.calcTitle}</h2>
          <p className="text-sm text-ink-soft">{t.home.calcHint}</p>
        </div>
      )}
      {compact && <h2 id={`${id}-title`} className="sr-only">{t.home.calcTitle}</h2>}
      <div className="grid grid-cols-2 gap-3">
        {packs.map((p, i) => {
          const r = result?.comparable ? result.ranked.find((x) => x.id === String(i)) : undefined;
          const winner = result?.comparable && result.cheapestId === String(i) && result.spreadPercent >= 0.05;
          const dim = options[i].quantity?.dimension;
          return (
            <fieldset key={i} className={`@container rounded-[var(--radius-tag)] border p-3 transition-colors ${winner ? "border-pine bg-pine-tint/60" : "border-line bg-paper"}`}>
              <legend className="px-1 text-sm font-bold">{t.home.calcPack} {i === 0 ? "A" : "B"}</legend>
              <label className="label" htmlFor={`${id}-p${i}`}>{t.home.calcPrice} (€)</label>
              <input
                id={`${id}-p${i}`}
                className="field price !text-[1.6rem] !font-extrabold"
                inputMode="decimal"
                value={p.price}
                onChange={(e) => update(i as 0 | 1, { price: e.target.value })}
              />
              <div className="mt-2 grid grid-cols-1 gap-2 @[12rem]:grid-cols-[1fr_auto]">
                <div>
                  <label className="label" htmlFor={`${id}-a${i}`}>{t.home.calcAmount}</label>
                  <input id={`${id}-a${i}`} className="field num" inputMode="decimal" value={p.amount} onChange={(e) => update(i as 0 | 1, { amount: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor={`${id}-u${i}`}>{t.home.calcUnit}</label>
                  <select id={`${id}-u${i}`} className="field" value={p.unit} onChange={(e) => update(i as 0 | 1, { unit: e.target.value as Unit })}>
                    {(["g", "kg", "ml", "l", "stk"] as const).map((u) => (
                      <option key={u} value={u}>{u === "stk" ? t.common.perPiece.split(" ").pop() : u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="num mt-3 text-[0.95rem]" aria-live="polite">
                {r && dim ? (
                  <>
                    <span className="font-bold">{formatUnitPrice(r.unitPrice, intl)}</span>{" "}
                    <span className="text-ink-soft">{unitLabel(dim, t)}</span>
                  </>
                ) : (
                  <span className="text-slate">–</span>
                )}
              </p>
              {winner && dim && (
                <p className="mt-1 text-sm font-semibold text-pine-strong">{fmt(t.home.calcCheaper, { unit: unitName(dim) })}</p>
              )}
            </fieldset>
          );
        })}
      </div>
      <p className="mt-3 text-sm font-medium text-ink" role="status">
        {verdict}
        {result?.comparable && options[0].priceCents >= 0 && options[1].priceCents >= 0 && (
          <span className="sr-only"> ({formatCents(options[0].priceCents, intl)} / {formatCents(options[1].priceCents, intl)})</span>
        )}
      </p>
    </section>
  );
}
