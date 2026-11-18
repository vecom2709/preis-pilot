import type { DealCountry, RawDeal } from "../types";

export interface ConnectorContext {
  now: Date;
  env: Record<string, string | undefined>;
}

export interface Connector {
  key: string;
  label: string;
  /** public = öffentliche Schnittstelle ohne Schlüssel; api = Schlüssel nötig; feed = Händler-/Affiliate-Feed */
  kind: "public" | "api" | "feed";
  homepage: string;
  terms: string;
  /** Pflicht-Umgebungsvariablen (Zugangsdaten nur serverseitig, nie im Repository) */
  env: string[];
  countries: DealCountry[];
  intervalMinutes: number;
  trusted: boolean;
  fetch(country: DealCountry, ctx: ConnectorContext): Promise<RawDeal[]>;
  /** Live-Suche bei der Quelle (z. B. eBay) – optional */
  search?(q: string, country: DealCountry, ctx: ConnectorContext): Promise<RawDeal[]>;
}

export const isoDay = (d: string | null | undefined) => (d ? new Date(`${d.slice(0, 10)}T12:00:00Z`).toISOString() : null);
export const gtinOrNull = (v: unknown) => (typeof v === "string" && /^\d{8,14}$/.test(v.trim()) ? v.trim() : null);
export const httpsUrl = (v: unknown) => (typeof v === "string" && /^https?:\/\//.test(v) ? v.replace(/^http:/, "https:") : null);
