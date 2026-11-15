// Abbildung der Open-Prices-Antworten auf PriceObservation (rein, ohne Netzwerk – testbar).
import { z } from "zod";
import { toCents } from "../money";
import type { PriceDataType, PriceObservation } from "./types";

const LocationSchema = z
  .object({
    id: z.number(),
    osm_name: z.string().nullish(),
    osm_brand: z.string().nullish(),
    osm_address_city: z.string().nullish(),
    osm_address_country_code: z.string().nullish(),
    osm_lat: z.number().nullish(),
    osm_lon: z.number().nullish(),
    website_url: z.string().nullish(),
    type: z.string().nullish(),
  })
  .passthrough();

const ProofSchema = z
  .object({ id: z.number(), type: z.string().nullish(), file_path: z.string().nullish() })
  .passthrough();

const PriceSchema = z
  .object({
    id: z.number(),
    type: z.string().nullish(),
    product_code: z.string().nullish(),
    product_name: z.string().nullish(),
    product: z.object({ product_name: z.string().nullish() }).passthrough().nullish(),
    price: z.number(),
    currency: z.string(),
    price_per: z.string().nullish(),
    price_is_discounted: z.boolean().nullish(),
    price_without_discount: z.number().nullish(),
    discount_type: z.string().nullish(),
    date: z.string(),
    created: z.string(),
    location: LocationSchema.nullish(),
    proof: ProofSchema.nullish(),
    duplicate_of: z.number().nullish(),
  })
  .passthrough();

export const PricesPageSchema = z.object({
  items: z.array(PriceSchema),
  total: z.number().optional(),
  page: z.number().optional(),
  pages: z.number().optional(),
});

function dataTypeFromProof(type: string | null | undefined): PriceDataType {
  switch (type) {
    case "PRICE_TAG":
      return "price_tag";
    case "RECEIPT":
      return "receipt";
    case "SHOP_IMPORT":
      return "shop_import";
    case "GDPR_REQUEST":
      return "gdpr_request";
    default:
      return "unproven";
  }
}

export function mapPrice(raw: z.infer<typeof PriceSchema>): PriceObservation | null {
  const priceCents = toCents(raw.price);
  if (priceCents === null) return null;
  const loc = raw.location;
  return {
    id: `op-${raw.id}`,
    source: "open_prices",
    dataType: dataTypeFromProof(raw.proof?.type),
    productCode: raw.product_code ?? null,
    productName: raw.product?.product_name ?? raw.product_name ?? null,
    priceCents,
    currency: raw.currency,
    pricePer: raw.price_per === "KILOGRAM" ? "kg" : raw.price_per === "UNIT" ? "unit" : "item",
    isDiscounted: raw.price_is_discounted === true,
    priceWithoutDiscountCents: raw.price_without_discount != null ? toCents(raw.price_without_discount) : null,
    discountType: raw.discount_type ?? null,
    date: raw.date,
    recordedAt: raw.created,
    store: {
      locationId: loc?.id ?? null,
      name: loc?.osm_name?.trim() || loc?.osm_brand?.trim() || "Unbekanntes Geschäft",
      chain: loc?.osm_brand?.trim() || null,
      city: loc?.osm_address_city ?? null,
      countryCode: loc?.osm_address_country_code ?? null,
      lat: loc?.osm_lat ?? null,
      lon: loc?.osm_lon ?? null,
    },
    duplicateOf: raw.duplicate_of != null ? `op-${raw.duplicate_of}` : null,
    proofUrl: raw.proof?.id ? `https://prices.openfoodfacts.org/proofs/${raw.proof.id}` : null,
    // Open Prices dokumentiert nur das Beobachtungsdatum, keine Angebotslaufzeit.
    validFrom: null,
    validUntil: null,
  };
}

export function mapPricesPage(json: unknown): { items: PriceObservation[]; total: number } {
  const parsed = PricesPageSchema.safeParse(json);
  if (!parsed.success) return { items: [], total: 0 };
  const items = parsed.data.items.map(mapPrice).filter((p): p is PriceObservation => p !== null);
  return { items, total: parsed.data.total ?? items.length };
}
