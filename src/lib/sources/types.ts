// Einheitliche Domänentypen – unabhängig von der jeweiligen externen Datenquelle.

export type CountryCode = "DE" | "IT";

export type DataSourceId = "open_food_facts" | "open_prices" | "manual" | "receipt";

/** Art des Preisnachweises – wird in der Oberfläche immer mit angezeigt. */
export type PriceDataType = "price_tag" | "receipt" | "shop_import" | "gdpr_request" | "unproven" | "manual";

export interface Product {
  code: string;
  name: string | null;
  brand: string | null;
  quantityText: string | null;
  /** Packungsinhalt in Basiseinheit (g/ml/Stück) – null, wenn unbekannt */
  packageBase: number | null;
  packageDimension: "mass" | "volume" | "count" | null;
  imageUrl: string | null;
  categories: string[];
  nutriscore: string | null;
  source: "open_food_facts";
  sourceUrl: string;
}

export interface SearchHit {
  code: string;
  name: string | null;
  brand: string | null;
  quantityText: string | null;
  imageUrl: string | null;
}

export interface StoreRef {
  locationId: number | null;
  name: string;
  /** Handelskette (aus OpenStreetMap), falls bekannt */
  chain: string | null;
  city: string | null;
  countryCode: string | null;
  lat: number | null;
  lon: number | null;
}

export interface PriceObservation {
  id: string;
  source: DataSourceId;
  dataType: PriceDataType;
  productCode: string | null;
  productName: string | null;
  priceCents: number;
  currency: string;
  /** "item" = Preis je Packung; "kg"/"unit" bei losen Waren */
  pricePer: "item" | "kg" | "unit";
  isDiscounted: boolean;
  priceWithoutDiscountCents: number | null;
  discountType: string | null;
  /** Datum der Preisbeobachtung im Geschäft (YYYY-MM-DD) */
  date: string;
  /** Zeitpunkt der Erfassung in der Datenbank */
  recordedAt: string;
  store: StoreRef;
  duplicateOf: string | null;
  proofUrl: string | null;
  /** Gültigkeit eines Angebots – nur gesetzt, wenn belegt */
  validFrom: string | null;
  validUntil: string | null;
}
