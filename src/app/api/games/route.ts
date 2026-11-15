import { z } from "zod";
import { countrySchema, parseQuery, rateLimited, sourceFailure } from "@/lib/api";
import { missingKey, searchGames } from "@/lib/sources/media-live";

const Query = z.object({ q: z.string().trim().min(2).max(100), country: countrySchema });

export async function GET(req: Request) {
  const limited = await rateLimited(req);
  if (limited) return limited;
  const q = parseQuery(req, Query);
  if (q instanceof Response) return q;
  const noKey = missingKey("itad");
  if (noKey) return noKey;
  try {
    return Response.json({ source: "IsThereAnyDeal", games: await searchGames(q.q, q.country) });
  } catch (err) {
    return sourceFailure(err);
  }
}
