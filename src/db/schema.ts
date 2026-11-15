// PostgreSQL-Datenmodell (Drizzle ORM) für die Ausbaustufen mit Konto, Haushalten, Community und Administration.
// Version 0.1 läuft ohne Datenbank (lokal im Browser). Dieses Schema ist die verbindliche Grundlage für Phase 5/6.
// Geldbeträge: immer integer in Cent. Zeitstempel: timestamptz.
import { sql } from "drizzle-orm";
import {
  boolean, check, date, index, integer, jsonb, pgEnum, pgTable, primaryKey, real, text, timestamp, uniqueIndex, uuid, varchar,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const dataSource = pgEnum("data_source", ["open_food_facts", "open_prices", "manual", "receipt", "community", "retailer_api"]);
export const priceDataType = pgEnum("price_data_type", ["price_tag", "receipt", "shop_import", "gdpr_request", "unproven", "manual"]);
export const trustStatus = pgEnum("trust_status", ["unverified", "verified", "flagged", "rejected"]);
export const pricePer = pgEnum("price_per", ["item", "kg", "unit"]);
export const dimension = pgEnum("dimension", ["mass", "volume", "count"]);
export const costKind = pgEnum("cost_kind", ["planned", "estimated", "paid"]);
export const budgetPeriod = pgEnum("budget_period", ["purchase", "day", "week", "month"]);
export const listKind = pgEnum("list_kind", ["shopping", "recurring", "pantry"]);
export const householdRole = pgEnum("household_role", ["owner", "editor", "viewer"]);
export const userRole = pgEnum("user_role", ["user", "moderator", "admin"]);
export const contributionStatus = pgEnum("contribution_status", ["pending", "approved", "rejected"]);
export const contributionType = pgEnum("contribution_type", ["price", "store_assignment", "price_tag_photo", "error_report", "outdated_flag"]);

// ---------- Konten & Haushalte ----------
export const userProfiles = pgTable("user_profiles", {
  id: id(),
  email: varchar("email", { length: 254 }).notNull(),
  passwordHash: text("password_hash"),
  displayName: varchar("display_name", { length: 60 }),
  locale: varchar("locale", { length: 5 }).notNull().default("de"),
  country: varchar("country", { length: 2 }).notNull().default("DE"),
  role: userRole("role").notNull().default("user"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("user_profiles_email_uq").on(sql`lower(${t.email})`)]);

export const households = pgTable("households", {
  id: id(),
  name: varchar("name", { length: 60 }).notNull(),
  createdBy: uuid("created_by").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
});

export const householdMembers = pgTable("household_members", {
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
  role: householdRole("role").notNull().default("editor"),
  joinedAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.householdId, t.userId] }), index("household_members_user_idx").on(t.userId)]);

// ---------- Produkte & Händler ----------
export const products = pgTable("products", {
  id: id(),
  /** GTIN/EAN; null bei losen Waren (dann category_tag) */
  code: varchar("code", { length: 14 }),
  categoryTag: varchar("category_tag", { length: 120 }),
  name: text("name"),
  brand: text("brand"),
  imageUrl: text("image_url"),
  categories: text("categories").array().notNull().default(sql`'{}'::text[]`),
  source: dataSource("source").notNull().default("open_food_facts"),
  sourceSyncedAt: timestamp("source_synced_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex("products_code_uq").on(t.code),
  index("products_category_idx").on(t.categoryTag),
  check("products_code_or_category", sql`${t.code} IS NOT NULL OR ${t.categoryTag} IS NOT NULL`),
]);

/** Packungsvarianten (gleiches Produkt, andere Größe) – Grundlage des Packungsvergleichs */
export const productVariants = pgTable("product_variants", {
  id: id(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantityText: varchar("quantity_text", { length: 60 }),
  packageBase: real("package_base"),
  dimension: dimension("dimension"),
  /** Variantengruppe: nur ausdrücklich verknüpfte Produkte gelten als „gleich“ */
  variantGroup: uuid("variant_group"),
  createdAt: createdAt(),
}, (t) => [index("product_variants_product_idx").on(t.productId), index("product_variants_group_idx").on(t.variantGroup)]);

export const retailers = pgTable("retailers", {
  id: id(),
  name: varchar("name", { length: 120 }).notNull(),
  countries: varchar("countries", { length: 2 }).array().notNull().default(sql`'{}'::varchar[]`),
  website: text("website"),
  /** nur rechtmäßig nutzbare Quellen; Status je Händler dokumentiert */
  dataAccess: varchar("data_access", { length: 40 }).notNull().default("community_only"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("retailers_name_uq").on(sql`lower(${t.name})`)]);

export const storeLocations = pgTable("store_locations", {
  id: id(),
  retailerId: uuid("retailer_id").references(() => retailers.id, { onDelete: "set null" }),
  osmType: varchar("osm_type", { length: 8 }),
  osmId: varchar("osm_id", { length: 20 }),
  openPricesLocationId: integer("open_prices_location_id"),
  name: varchar("name", { length: 160 }).notNull(),
  city: varchar("city", { length: 120 }),
  postcode: varchar("postcode", { length: 12 }),
  country: varchar("country", { length: 2 }).notNull(),
  lat: real("lat"),
  lon: real("lon"),
  createdAt: createdAt(),
}, (t) => [
  uniqueIndex("store_locations_osm_uq").on(t.osmType, t.osmId),
  index("store_locations_country_city_idx").on(t.country, t.city),
  index("store_locations_retailer_idx").on(t.retailerId),
]);

// ---------- Preise & Angebote ----------
export const priceObservations = pgTable("price_observations", {
  id: id(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  storeLocationId: uuid("store_location_id").references(() => storeLocations.id, { onDelete: "set null" }),
  priceCents: integer("price_cents").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  pricePer: pricePer("price_per").notNull().default("item"),
  isDiscounted: boolean("is_discounted").notNull().default(false),
  priceWithoutDiscountCents: integer("price_without_discount_cents"),
  observedOn: date("observed_on").notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  source: dataSource("source").notNull(),
  dataType: priceDataType("data_type").notNull(),
  externalId: varchar("external_id", { length: 40 }),
  proofUrl: text("proof_url"),
  trust: trustStatus("trust").notNull().default("unverified"),
  qualityFlags: text("quality_flags").array().notNull().default(sql`'{}'::text[]`),
  duplicateOf: uuid("duplicate_of"),
  contributorId: uuid("contributor_id").references(() => userProfiles.id, { onDelete: "set null" }),
}, (t) => [
  index("price_obs_product_date_idx").on(t.productId, t.observedOn.desc()),
  index("price_obs_store_idx").on(t.storeLocationId, t.observedOn.desc()),
  uniqueIndex("price_obs_external_uq").on(t.source, t.externalId),
  check("price_obs_positive", sql`${t.priceCents} > 0`),
]);

/** Angebote nur mit belegter Laufzeit gelten als aktuell */
export const offers = pgTable("offers", {
  id: id(),
  priceObservationId: uuid("price_observation_id").notNull().references(() => priceObservations.id, { onDelete: "cascade" }),
  validFrom: date("valid_from"),
  validUntil: date("valid_until"),
  conditions: text("conditions"),
  minQuantity: integer("min_quantity"),
  validityProofUrl: text("validity_proof_url"),
  createdAt: createdAt(),
}, (t) => [index("offers_validity_idx").on(t.validFrom, t.validUntil)]);

// ---------- Listen, Budgets, Käufe ----------
export const shoppingLists = pgTable("shopping_lists", {
  id: id(),
  ownerId: uuid("owner_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 60 }).notNull(),
  kind: listKind("kind").notNull().default("shopping"),
  /** steigt bei jeder Änderung – nachvollziehbare Synchronisation (optimistic concurrency) */
  revision: integer("revision").notNull().default(1),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("shopping_lists_owner_idx").on(t.ownerId), index("shopping_lists_household_idx").on(t.householdId)]);

export const shoppingListItems = pgTable("shopping_list_items", {
  id: id(),
  listId: uuid("list_id").notNull().references(() => shoppingLists.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  name: varchar("name", { length: 120 }).notNull(),
  quantity: real("quantity").notNull().default(1),
  category: varchar("category", { length: 40 }).notNull().default(""),
  priceCents: integer("price_cents"),
  priceSource: dataSource("price_source"),
  priceObservationId: uuid("price_observation_id").references(() => priceObservations.id, { onDelete: "set null" }),
  checked: boolean("checked").notNull().default(false),
  favorite: boolean("favorite").notNull().default(false),
  position: integer("position").notNull().default(0),
  updatedBy: uuid("updated_by").references(() => userProfiles.id, { onDelete: "set null" }),
  updatedAt: updatedAt(),
}, (t) => [index("shopping_list_items_list_idx").on(t.listId, t.position)]);

export const budgets = pgTable("budgets", {
  id: id(),
  ownerId: uuid("owner_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 60 }).notNull(),
  period: budgetPeriod("period").notNull(),
  limitCents: integer("limit_cents").notNull(),
  category: varchar("category", { length: 40 }),
  memberId: uuid("member_id").references(() => userProfiles.id, { onDelete: "set null" }),
  warnAtPercent: integer("warn_at_percent").notNull().default(80),
  createdAt: createdAt(),
}, (t) => [index("budgets_owner_idx").on(t.ownerId), check("budgets_limit_positive", sql`${t.limitCents} > 0`)]);

export const purchases = pgTable("purchases", {
  id: id(),
  ownerId: uuid("owner_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }),
  storeLocationId: uuid("store_location_id").references(() => storeLocations.id, { onDelete: "set null" }),
  storeName: varchar("store_name", { length: 80 }),
  purchasedOn: date("purchased_on").notNull(),
  amountCents: integer("amount_cents").notNull(),
  kind: costKind("kind").notNull(),
  category: varchar("category", { length: 40 }),
  source: varchar("source", { length: 10 }).notNull().default("manual"),
  /** verhindert doppelte Buchungen (Tag|Geschäft|Betrag|Art) */
  fingerprint: varchar("fingerprint", { length: 200 }).notNull(),
  createdAt: createdAt(),
}, (t) => [
  index("purchases_owner_date_idx").on(t.ownerId, t.purchasedOn.desc()),
  uniqueIndex("purchases_owner_fingerprint_uq").on(t.ownerId, t.fingerprint),
]);

/** Kassenbon-Positionen – Bilddaten werden nicht dauerhaft gespeichert */
export const receiptItems = pgTable("receipt_items", {
  id: id(),
  purchaseId: uuid("purchase_id").notNull().references(() => purchases.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  rawText: varchar("raw_text", { length: 200 }),
  name: varchar("name", { length: 120 }).notNull(),
  quantity: real("quantity").notNull().default(1),
  amountCents: integer("amount_cents").notNull(),
  corrected: boolean("corrected").notNull().default(false),
}, (t) => [index("receipt_items_purchase_idx").on(t.purchaseId)]);

export const pantryItems = pgTable("pantry_items", {
  id: id(),
  ownerId: uuid("owner_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  name: varchar("name", { length: 120 }).notNull(),
  quantity: real("quantity").notNull().default(1),
  minQuantity: real("min_quantity"),
  bestBefore: date("best_before"),
  updatedAt: updatedAt(),
}, (t) => [index("pantry_items_owner_idx").on(t.ownerId), index("pantry_items_best_before_idx").on(t.bestBefore)]);

export const priceAlerts = pgTable("price_alerts", {
  id: id(),
  ownerId: uuid("owner_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  country: varchar("country", { length: 2 }).notNull(),
  thresholdCents: integer("threshold_cents").notNull(),
  pushConsentAt: timestamp("push_consent_at", { withTimezone: true }),
  lastNotifiedObservationId: uuid("last_notified_observation_id"),
  createdAt: createdAt(),
}, (t) => [index("price_alerts_product_idx").on(t.productId, t.country)]);

// ---------- Community, Moderation, Protokoll ----------
export const userContributions = pgTable("user_contributions", {
  id: id(),
  contributorId: uuid("contributor_id").references(() => userProfiles.id, { onDelete: "set null" }),
  type: contributionType("type").notNull(),
  status: contributionStatus("status").notNull().default("pending"),
  payload: jsonb("payload").notNull(),
  priceObservationId: uuid("price_observation_id").references(() => priceObservations.id, { onDelete: "set null" }),
  moderatorId: uuid("moderator_id").references(() => userProfiles.id, { onDelete: "set null" }),
  moderatedAt: timestamp("moderated_at", { withTimezone: true }),
  moderationNote: text("moderation_note"),
  createdAt: createdAt(),
}, (t) => [index("user_contributions_status_idx").on(t.status, t.createdAt)]);

export const auditLogs = pgTable("audit_logs", {
  id: id(),
  actorId: uuid("actor_id").references(() => userProfiles.id, { onDelete: "set null" }),
  action: varchar("action", { length: 80 }).notNull(),
  entity: varchar("entity", { length: 60 }).notNull(),
  entityId: varchar("entity_id", { length: 60 }),
  details: jsonb("details"),
  createdAt: createdAt(),
}, (t) => [index("audit_logs_entity_idx").on(t.entity, t.entityId), index("audit_logs_created_idx").on(t.createdAt)]);

// ================= Preis-Pilot 2.0: Multimedia, Abos, Familienbudget, Datenquellen =================
export const mediaCondition = pgEnum("media_condition", ["new", "used", "refurbished", "demo", "digital", "subscription"]);
export const mediaAvailability = pgEnum("media_availability", ["in_stock", "limited", "out_of_stock", "unknown"]);
export const offerSource = pgEnum("offer_source", ["manual", "feed", "affiliate", "partner_api"]);
export const subCategory = pgEnum("sub_category", ["video", "music", "gaming", "cloud", "software", "productivity", "media", "other"]);
export const billingCycle = pgEnum("billing_cycle", ["weekly", "monthly", "quarterly", "yearly"]);
export const noticeUnit = pgEnum("notice_unit", ["days", "weeks", "months"]);
export const subStatus = pgEnum("sub_status", ["active", "cancelled"]);
export const usageLevel = pgEnum("usage_level", ["often", "sometimes", "rarely", "never"]);
export const householdCategory = pgEnum("household_category", ["food", "household", "electronics", "multimedia", "streaming", "gaming", "digital", "other"]);
export const titleType = pgEnum("title_type", ["movie", "series"]);
export const sourceState = pgEnum("source_state", ["active", "needs_key", "disabled", "error"]);

/** Multimedia-Produkte: eine Zeile je Variante (Marke + normalisierte Modellnummer + Variantenmerkmale) */
export const mediaProducts = pgTable("media_products", {
  id: id(),
  category: varchar("category", { length: 40 }).notNull(),
  specSchema: varchar("spec_schema", { length: 20 }).notNull(),
  brand: varchar("brand", { length: 60 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  model: varchar("model", { length: 60 }).notNull(),
  modelNormalized: varchar("model_normalized", { length: 60 }).notNull(),
  /** Variantenschlüssel, z. B. "storageGb=256|screenInches=65" */
  variantKey: varchar("variant_key", { length: 200 }).notNull().default(""),
  specs: jsonb("specs").notNull().default({}),
  specSourceUrl: text("spec_source_url"),
  imageUrl: text("image_url"),
  ean: varchar("ean", { length: 14 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex("media_products_variant_uq").on(sql`lower(${t.brand})`, t.modelNormalized, t.variantKey),
  index("media_products_category_idx").on(t.category),
]);

export const merchants = pgTable("merchants", {
  id: id(),
  name: varchar("name", { length: 80 }).notNull(),
  website: text("website"),
  country: varchar("country", { length: 2 }),
  /** Impressum geprüft – null = nicht geprüft (wird als „unbekannt“ angezeigt, nicht als Verdacht) */
  imprintUrl: text("imprint_url"),
  imprintCheckedAt: timestamp("imprint_checked_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("merchants_name_uq").on(sql`lower(${t.name})`)]);

/** Händlerangebote mit Zeitstempel; „aktuell“ nur, wenn die Beobachtung frisch ist (≤ 24 h) */
export const merchantOffers = pgTable("merchant_offers", {
  id: id(),
  mediaProductId: uuid("media_product_id").notNull().references(() => mediaProducts.id, { onDelete: "cascade" }),
  merchantId: uuid("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  url: text("url"),
  priceCents: integer("price_cents").notNull(),
  /** null = Versandkosten unbekannt */
  shippingCents: integer("shipping_cents"),
  condition: mediaCondition("condition").notNull(),
  availability: mediaAvailability("availability").notNull().default("unknown"),
  warrantyMonths: integer("warranty_months"),
  promo: text("promo"),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
  source: offerSource("source").notNull(),
  /** Pflicht bei Partner-/Affiliate-Links: Kennzeichnung als Werbung */
  sponsored: boolean("sponsored").notNull().default(false),
  reportedBy: uuid("reported_by").references(() => userProfiles.id, { onDelete: "set null" }),
  createdAt: createdAt(),
}, (t) => [
  index("merchant_offers_product_idx").on(t.mediaProductId, t.condition, t.observedAt),
  check("merchant_offers_price_nonneg", sql`${t.priceCents} >= 0 AND (${t.shippingCents} IS NULL OR ${t.shippingCents} >= 0)`),
]);

export const wishlistItems = pgTable("wishlist_items", {
  ownerId: uuid("owner_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
  mediaProductId: uuid("media_product_id").notNull().references(() => mediaProducts.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.ownerId, t.mediaProductId] })]);

export const productWatches = pgTable("product_watches", {
  id: id(),
  ownerId: uuid("owner_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
  mediaProductId: uuid("media_product_id").notNull().references(() => mediaProducts.id, { onDelete: "cascade" }),
  thresholdCents: integer("threshold_cents").notNull(),
  condition: mediaCondition("condition").notNull().default("new"),
  pushConsentAt: timestamp("push_consent_at", { withTimezone: true }),
  lastNotifiedOfferId: uuid("last_notified_offer_id"),
  createdAt: createdAt(),
}, (t) => [index("product_watches_product_idx").on(t.mediaProductId), check("product_watches_threshold_pos", sql`${t.thresholdCents} > 0`)]);

/** Abos werden ausschließlich vom Nutzer erfasst – keine Anbindung fremder Konten, keine automatischen Kündigungen */
export const subscriptions = pgTable("subscriptions", {
  id: id(),
  ownerId: uuid("owner_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 60 }).notNull(),
  category: subCategory("category").notNull(),
  priceCents: integer("price_cents").notNull(),
  cycle: billingCycle("cycle").notNull(),
  startDate: date("start_date").notNull(),
  minTermMonths: integer("min_term_months"),
  renewalMonths: integer("renewal_months"),
  noticeValue: integer("notice_value"),
  noticeUnit: noticeUnit("notice_unit"),
  status: subStatus("status").notNull().default("active"),
  endsOn: date("ends_on"),
  usage: usageLevel("usage"),
  yearlyOptionCents: integer("yearly_option_cents"),
  familyPriceCents: integer("family_price_cents"),
  familyPeople: integer("family_people"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("subscriptions_owner_idx").on(t.ownerId, t.status), check("subscriptions_price_nonneg", sql`${t.priceCents} >= 0`)]);

export const subscriptionPriceChanges = pgTable("subscription_price_changes", {
  id: id(),
  subscriptionId: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  validFrom: date("valid_from").notNull(),
  priceCents: integer("price_cents").notNull(),
}, (t) => [index("subscription_price_changes_sub_idx").on(t.subscriptionId, t.validFrom)]);

export const householdPlans = pgTable("household_plans", {
  id: id(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  month: date("month").notNull(),
  totalCents: integer("total_cents").notNull(),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("household_plans_month_uq").on(t.householdId, t.month)]);

export const householdPlanAllocations = pgTable("household_plan_allocations", {
  planId: uuid("plan_id").notNull().references(() => householdPlans.id, { onDelete: "cascade" }),
  category: householdCategory("category").notNull(),
  cents: integer("cents").notNull(),
}, (t) => [primaryKey({ columns: [t.planId, t.category] })]);

export const savingsGoals = pgTable("savings_goals", {
  id: id(),
  ownerId: uuid("owner_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 60 }).notNull(),
  targetCents: integer("target_cents").notNull(),
  savedCents: integer("saved_cents").notNull().default(0),
  monthlyCents: integer("monthly_cents").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [check("savings_goals_target_pos", sql`${t.targetCents} > 0`)]);

/** Lizenzierte Film-/Serien-Metadaten (z. B. TMDB) – nur Metadaten, keine Inhalte */
export const mediaTitles = pgTable("media_titles", {
  id: id(),
  externalSource: varchar("external_source", { length: 20 }).notNull(),
  externalId: varchar("external_id", { length: 40 }).notNull(),
  type: titleType("type").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  year: integer("year"),
  attribution: text("attribution").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
}, (t) => [uniqueIndex("media_titles_ext_uq").on(t.externalSource, t.externalId)]);

/** Streaming-Verfügbarkeit je Land; fehlender Eintrag = unbekannt (nie „nicht verfügbar“ annehmen) */
export const streamingAvailability = pgTable("streaming_availability", {
  id: id(),
  titleId: uuid("title_id").notNull().references(() => mediaTitles.id, { onDelete: "cascade" }),
  country: varchar("country", { length: 2 }).notNull(),
  provider: varchar("provider", { length: 80 }).notNull(),
  offerType: varchar("offer_type", { length: 20 }).notNull(),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull(),
}, (t) => [index("streaming_availability_title_idx").on(t.titleId, t.country)]);

/** Admin 2.0: Zustand jeder Datenquelle (aktiv, Schlüssel fehlt, deaktiviert, Fehler) */
export const dataSourceConnections = pgTable("data_source_connections", {
  key: varchar("key", { length: 40 }).primaryKey(),
  label: varchar("label", { length: 80 }).notNull(),
  state: sourceState("state").notNull().default("disabled"),
  license: varchar("license", { length: 80 }),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastError: text("last_error"),
  updatedAt: updatedAt(),
});
