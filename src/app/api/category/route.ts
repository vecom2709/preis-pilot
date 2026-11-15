import { z } from "zod";
import { parseQuery, rateLimited, sourceFailure } from "@/lib/api";
import { findCategory } from "@/lib/categories";
import { getCategoryProducts } from "@/lib/sources/catalog";

const Query = z.object({ slug: z.string().max(40), page: z.coerce.number().int().min(1).max(20).default(1) });

export async function GET(req: Request) {
  const limited = await rateLimited(req);
  if (limited) return limited;
  const q = parseQuery(req, Query);
  if (q instanceof Response) return q;
  const category = findCategory(q.slug);
  if (!category) return Response.json({ error: "unknown_category" }, { status: 404 });
  try {
    return Response.json({ slug: category.slug, page: q.page, ...(await getCategoryProducts(category.filter, q.page)) });
  } catch (err) {
    return sourceFailure(err);
  }
}
