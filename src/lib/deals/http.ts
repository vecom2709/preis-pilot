// Netzabrufe der Connectoren: Zeitlimit, eindeutiger User-Agent, Wiederholung mit Wartezeit.
export const UA = "Preis-Pilot/3.0 (+https://preis-pilot.de; info@vecom-design.it)";

export class FetchError extends Error {
  constructor(message: string, readonly status: number | null) {
    super(message);
  }
}

export async function getJson<T = unknown>(url: string, init: RequestInit = {}, timeoutMs = 9000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal, headers: { "User-Agent": UA, Accept: "application/json", ...init.headers } });
    if (!res.ok) throw new FetchError(`HTTP ${res.status}`, res.status);
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof FetchError) throw e;
    throw new FetchError(e instanceof Error ? (e.name === "AbortError" ? "Zeitüberschreitung" : e.message) : "Netzwerkfehler", null);
  } finally {
    clearTimeout(timer);
  }
}

export async function getText(url: string, init: RequestInit = {}, timeoutMs = 15000): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal, headers: { "User-Agent": UA, ...init.headers } });
    if (!res.ok) throw new FetchError(`HTTP ${res.status}`, res.status);
    if (url.endsWith(".gz") || res.headers.get("content-type")?.includes("gzip")) {
      const stream = res.body!.pipeThrough(new DecompressionStream("gzip"));
      return await new Response(stream).text();
    }
    return await res.text();
  } catch (e) {
    if (e instanceof FetchError) throw e;
    throw new FetchError(e instanceof Error ? (e.name === "AbortError" ? "Zeitüberschreitung" : e.message) : "Netzwerkfehler", null);
  } finally {
    clearTimeout(timer);
  }
}

/** Bis zu `attempts` Versuche; 4xx (außer 429) wird nicht wiederholt. */
export async function withRetry<T>(fn: () => Promise<T>, attempts = 3, waitMs = 800): Promise<{ value: T; attempts: number }> {
  let last: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return { value: await fn(), attempts: i };
    } catch (e) {
      last = e;
      const status = e instanceof FetchError ? e.status : null;
      if (status !== null && status >= 400 && status < 500 && status !== 429) break;
      if (i < attempts) await new Promise((r) => setTimeout(r, waitMs * i));
    }
  }
  throw Object.assign(last instanceof Error ? last : new Error(String(last)), { attempts });
}

export const toCents = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
};
