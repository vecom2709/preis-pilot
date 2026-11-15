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
