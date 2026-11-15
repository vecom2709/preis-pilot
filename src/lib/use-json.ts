"use client";
import { useCallback, useEffect, useState } from "react";

export type FetchState<T> =
  | { status: "idle" | "loading"; data: null; error: null }
  | { status: "ok"; data: T; error: null }
  | { status: "error"; data: null; error: { code: string; status: number } };

const IDLE = { status: "idle", data: null, error: null } as const;
const LOADING = { status: "loading", data: null, error: null } as const;

/** Lädt JSON von den eigenen API-Routen; veraltete Anfragen werden abgebrochen. */
export function useJson<T>(url: string | null): FetchState<T> & { reload: () => void } {
  const [tick, setTick] = useState(0);
  const key = url ? `${url}#${tick}` : null;
  const [result, setResult] = useState<{ key: string; state: FetchState<T> } | null>(null);

  useEffect(() => {
    if (!url || !key) return;
    const c = new AbortController();
    fetch(url, { signal: c.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        setResult({
          key,
          state: res.ok
            ? { status: "ok", data: body as T, error: null }
            : { status: "error", data: null, error: { code: body.error ?? "http_error", status: res.status } },
        });
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setResult({ key, state: { status: "error", data: null, error: { code: "network", status: 0 } } });
      });
    return () => c.abort();
  }, [url, key]);

  const reload = useCallback(() => setTick((x) => x + 1), []);
  const state: FetchState<T> = !key ? IDLE : result?.key === key ? result.state : LOADING;
  return { ...state, reload };
}
