import "server-only";

// Open Food Facts verlangt einen eindeutigen User-Agent im Format "App/Version (Kontakt)".
const USER_AGENT =
  process.env.PREISPILOT_USER_AGENT ?? "Preis-Pilot/0.1 (info@vecom-design.it)";

export class SourceError extends Error {
  constructor(
    public readonly source: string,
    public readonly status: number | null,
    message: string,
  ) {
    super(message);
  }
}

export async function fetchJson(source: string, url: string, opts: { timeoutMs?: number; allow404?: boolean } = {}): Promise<unknown> {
  const timeoutMs = opts.timeoutMs ?? 9000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: controller.signal,
    });
    // Open Food Facts v3 meldet „nicht gefunden“ als 404 mit JSON-Inhalt – das ist kein Ausfall.
    if (res.status === 404 && opts.allow404) return await res.json();
    if (!res.ok) throw new SourceError(source, res.status, `${source} antwortete mit ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err instanceof SourceError) throw err;
    throw new SourceError(source, null, `${source} nicht erreichbar`);
  } finally {
    clearTimeout(timer);
  }
}
