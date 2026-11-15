"use client";
import { useState, type FormEvent } from "react";
import { useCountry } from "@/i18n/client";
import { fmt } from "@/i18n";
import { Notice } from "@/components/ui/Notice";
import { IconExternal, IconSearch } from "@/components/ui/icons";
import { useMedia } from "./shared";

type State<T> = { status: "idle" } | { status: "loading" } | { status: "ok"; data: T } | { status: "missing"; source: string } | { status: "error" };

interface GameDeal { shop: string; priceCents: number; regularCents: number; cut: number; currency: string; drm: string[]; platforms: string[]; observedAt: string; url: string }
interface TitleHit { id: number; type: "movie" | "tv"; title: string; year: number | null; flatrate: string[] | null; rent: string[] | null; buy: string[] | null; link: string | null }

function useLive<T>() {
  const [state, setState] = useState<State<T>>({ status: "idle" });
  async function run(url: string) {
    setState({ status: "loading" });
    try {
      const res = await fetch(url);
      const body = await res.json();
      if (res.status === 503 && body.error === "missing_key") setState({ status: "missing", source: body.source === "itad" ? "IsThereAnyDeal" : "TMDB" });
      else if (!res.ok) setState({ status: "error" });
      else setState({ status: "ok", data: body as T });
    } catch {
      setState({ status: "error" });
    }
  }
  return { state, run };
}

function SearchForm({ id, placeholder, busy, onSearch }: { id: string; placeholder: string; busy: boolean; onSearch: (q: string) => void }) {
  const { t } = useMedia();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    if (q.length >= 2) onSearch(q);
  }
  return (
    <form onSubmit={submit} className="flex gap-2" role="search">
      <label htmlFor={id} className="sr-only">{placeholder}</label>
      <input id={id} name="q" className="field" placeholder={placeholder} minLength={2} maxLength={100} required />
      <button type="submit" className="btn btn-primary" disabled={busy}><IconSearch width={18} height={18} />{busy ? t.live.searching : t.live.search}</button>
    </form>
  );
}

function Status({ state }: { state: State<unknown> }) {
  const { t } = useMedia();
  if (state.status === "missing") return <Notice tone="warn">{fmt(t.live.missingKey, { source: state.source })}</Notice>;
  if (state.status === "error") return <Notice tone="danger">{t.live.down}</Notice>;
  return null;
}

export function GameSearch() {
  const { t, money } = useMedia();
  const country = useCountry();
  const { state, run } = useLive<{ games: { id: string; title: string; deals: GameDeal[] }[] }>();
  return (
    <section aria-labelledby="games-live" className="panel space-y-4 p-4 sm:p-5">
      <div>
        <h2 id="games-live" className="text-lg font-bold">{t.live.gamesTitle}</h2>
        <p className="text-sm text-ink-soft">{t.live.gamesIntro}</p>
      </div>
      <SearchForm id="game-q" placeholder={t.live.placeholderGame} busy={state.status === "loading"} onSearch={(q) => run(`/api/games?q=${encodeURIComponent(q)}&country=${country}`)} />
      <Status state={state} />
      {state.status === "ok" && (
        state.data.games.length === 0 ? <p className="text-ink-soft">{t.live.none}</p> : (
          <ul className="space-y-4">
            {state.data.games.map((g) => (
              <li key={g.id}>
                <h3 className="font-bold">{g.title}</h3>
                {!g.deals.length ? <p className="text-sm text-ink-soft">{t.live.noDeals}</p> : (
                  <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                    {g.deals.slice(0, 6).map((d) => (
                      <li key={d.shop + d.url} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-[0.95rem]">
                        <a href={d.url} target="_blank" rel="nofollow noopener noreferrer" className="inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline">
                          {d.shop}<IconExternal width={14} height={14} />
                        </a>
                        <span className="text-sm text-ink-soft">{[d.platforms.join(", "), d.drm.length ? fmt(t.live.drm, { drm: d.drm.join(", ") }) : ""].filter(Boolean).join(" · ")}</span>
                        <span className="text-right">
                          <span className="price text-xl">{d.currency === "EUR" ? money(d.priceCents) : `${(d.priceCents / 100).toFixed(2)} ${d.currency}`}</span>
                          {d.cut > 0 && <span className="num block text-xs text-ink-soft">−{d.cut} % · {fmt(t.live.regular, { price: money(d.regularCents) })}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )
      )}
      <p className="text-xs text-ink-soft">{fmt(t.live.attribution, { source: "IsThereAnyDeal" })}</p>
    </section>
  );
}

export function TitleSearch() {
  const { t, locale, tm } = useMedia();
  const country = useCountry();
  const countryName = tm.common.countries[country];
  const { state, run } = useLive<{ titles: TitleHit[] }>();
  const row = (label: string, list: string[]) => list.length > 0 && <p className="text-sm"><span className="text-ink-soft">{label}:</span> {list.join(", ")}</p>;
  return (
    <section aria-labelledby="titles-live" className="panel space-y-4 p-4 sm:p-5">
      <div>
        <h2 id="titles-live" className="text-lg font-bold">{t.live.filmsTitle}</h2>
        <p className="text-sm text-ink-soft">{t.live.filmsIntro}</p>
      </div>
      <SearchForm id="title-q" placeholder={t.live.placeholderFilm} busy={state.status === "loading"} onSearch={(q) => run(`/api/titles?q=${encodeURIComponent(q)}&lang=${locale}&country=${country}`)} />
      <Status state={state} />
      {state.status === "ok" && (
        state.data.titles.length === 0 ? <p className="text-ink-soft">{t.live.none}</p> : (
          <ul className="divide-y divide-line">
            {state.data.titles.map((h) => (
              <li key={`${h.type}${h.id}`} className="space-y-1 py-3">
                <p className="font-bold">{h.title}{h.year ? ` (${h.year})` : ""}</p>
                {h.flatrate === null ? <p className="text-sm text-ink-soft">{fmt(t.live.unknownAvail, { country: countryName })}</p>
                  : !h.flatrate.length && !h.rent!.length && !h.buy!.length ? <p className="text-sm text-ink-soft">{fmt(t.live.notStreaming, { country: countryName })}</p>
                  : <>{row(t.live.flatrate, h.flatrate)}{row(t.live.rent, h.rent!)}{row(t.live.buy, h.buy!)}</>}
              </li>
            ))}
          </ul>
        )
      )}
      <p className="text-xs text-ink-soft">{fmt(t.live.attribution, { source: "TMDB · JustWatch" })}</p>
    </section>
  );
}
