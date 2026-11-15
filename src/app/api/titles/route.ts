import { z } from "zod";
import { countrySchema, langSchema, parseQuery, rateLimited, sourceFailure } from "@/lib/api";
import { missingKey, searchTitles } from "@/lib/sources/media-live";

const Query = z.object({ q: z.string().trim().min(2).max(100), lang: langSchema, country: countrySchema });

export async function GET(req: Request) {
  const limited = await rateLimited(req);
  if (limited) return limited;
  const q = parseQuery(req, Query);
  if (q instanceof Response) return q;
  const noKey = missingKey("tmdb");
  if (noKey) return noKey;
  try {
    return Response.json({ source: "TMDB", attribution: "TMDB · Verfügbarkeit: JustWatch", titles: await searchTitles(q.q, q.lang, q.country) });
  } catch (err) {
    return sourceFailure(err);
  }
}
