import "server-only";
import { z } from "zod";
import { SourceError } from "./sources/http";

// Einfache Begrenzung pro Client (im Speicher, IP wird nicht gespeichert, nur kurzzeitig gehasht gezählt),
// damit die kostenlosen Datenquellen nicht überlastet werden.
const WINDOW_MS = 60_000;
const LIMIT = 60;
const buckets = new Map<string, { count: number; reset: number }>();

async function clientKey(req: Request): Promise<string> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return Buffer.from(digest).toString("base64url").slice(0, 16);
}

export async function rateLimited(req: Request): Promise<Response | null> {
  const key = await clientKey(req);
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + WINDOW_MS });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return null;
  }
  b.count++;
  if (b.count > LIMIT) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(Math.ceil((b.reset - now) / 1000)) } });
  }
  return null;
}

export function parseQuery<T extends z.ZodTypeAny>(req: Request, schema: T): z.infer<T> | Response {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const r = schema.safeParse(params);
  if (!r.success) return Response.json({ error: "invalid_request", issues: r.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  return r.data;
}

/** Fehler aus Datenquellen-Aufrufen. Über die Cache-Grenze hinweg geht die Fehlerklasse verloren,
 *  daher gilt jeder Fehler in diesem Pfad als Ausfall der Datenquelle. */
export function sourceFailure(err: unknown): Response {
  const source = err instanceof SourceError ? err.source : "upstream";
  console.error(`[Preis-Pilot] Datenquelle fehlgeschlagen (${source}):`, err instanceof Error ? err.message : err);
  return Response.json({ error: "source_unavailable", source }, { status: 502 });
}

export const langSchema = z.enum(["de", "it", "en"]).default("de");
export const countrySchema = z.enum(["DE", "IT"]).default("DE");
