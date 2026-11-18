"use client";
import { useI18n } from "@/i18n/client";
import { formatDate } from "@/lib/format";
import { useJson } from "@/lib/use-json";

interface Status {
  sources: { key: string; label: string; homepage: string; state: "active" | "needs_key" | "disabled"; lastOk: string | null; deals: { DE: number; IT: number } }[];
  pending: { key: string; label: string; need: string; url: string }[];
}

/** Öffentliche Übersicht der Angebotsquellen (Transparenz zur Datenlage) */
export function SourcesStatus() {
  const { t, intl } = useI18n();
  const { data } = useJson<Status>("/api/deals/status");
  const D = t.deals;
  return (
    <section aria-labelledby="ds-title" className="panel overflow-x-auto p-5">
      <h2 id="ds-title" className="text-lg font-bold">{D.statusTitle}</h2>
      <p className="mb-3 text-ink-soft">{D.statusIntro}</p>
      {!data ? <div className="h-32 animate-pulse rounded-lg bg-mist-strong" /> : (
        <>
          <table className="w-full min-w-[34rem] text-sm">
            <thead><tr className="border-b border-line text-left text-ink-soft"><th className="py-2">{D.colSource}</th><th>{D.colState}</th><th className="text-right">{D.colDeals}</th><th className="text-right">{D.colLast}</th></tr></thead>
            <tbody className="divide-y divide-line">
              {data.sources.map((s) => (
                <tr key={s.key}>
                  <td className="py-2"><a href={s.homepage} target="_blank" rel="noopener noreferrer" className="font-semibold text-pine underline-offset-4 hover:underline">{s.label}</a></td>
                  <td>{D.sourceStates[s.state]}</td>
                  <td className="num text-right">{s.deals.DE} / {s.deals.IT}</td>
                  <td className="text-right">{s.lastOk ? formatDate(s.lastOk.slice(0, 10), intl) : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.pending.length > 0 && (
            <>
              <h3 className="mt-4 font-semibold">{D.pending}</h3>
              <ul className="mt-1 list-inside list-disc text-sm text-ink-soft">
                {data.pending.map((p) => <li key={p.key}>{p.label}</li>)}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
