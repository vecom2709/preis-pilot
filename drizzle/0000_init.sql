CREATE TYPE "public"."budget_period" AS ENUM('purchase', 'day', 'week', 'month');--> statement-breakpoint
CREATE TYPE "public"."contribution_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."contribution_type" AS ENUM('price', 'store_assignment', 'price_tag_photo', 'error_report', 'outdated_flag');--> statement-breakpoint
CREATE TYPE "public"."cost_kind" AS ENUM('planned', 'estimated', 'paid');--> statement-breakpoint
CREATE TYPE "public"."data_source" AS ENUM('open_food_facts', 'open_prices', 'manual', 'receipt', 'community', 'retailer_api');--> statement-breakpoint
CREATE TYPE "public"."dimension" AS ENUM('mass', 'volume', 'count');--> statement-breakpoint
CREATE TYPE "public"."household_role" AS ENUM('owner', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."list_kind" AS ENUM('shopping', 'recurring', 'pantry');--> statement-breakpoint
CREATE TYPE "public"."price_data_type" AS ENUM('price_tag', 'receipt', 'shop_import', 'gdpr_request', 'unproven', 'manual');--> statement-breakpoint
CREATE TYPE "public"."price_per" AS ENUM('item', 'kg', 'unit');--> statement-breakpoint
CREATE TYPE "public"."trust_status" AS ENUM('unverified', 'verified', 'flagged', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'moderator', 'admin');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" varchar(80) NOT NULL,
	"entity" varchar(60) NOT NULL,
	"entity_id" varchar(60),
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"household_id" uuid,
	"name" varchar(60) NOT NULL,
	"period" "budget_period" NOT NULL,
	"limit_cents" integer NOT NULL,
	"category" varchar(40),
	"member_id" uuid,
	"warn_at_percent" integer DEFAULT 80 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "budgets_limit_positive" CHECK ("budgets"."limit_cents" > 0)
);
--> statement-breakpoint
CREATE TABLE "household_members" (
	"household_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "household_role" DEFAULT 'editor' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "household_members_household_id_user_id_pk" PRIMARY KEY("household_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(60) NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"price_observation_id" uuid NOT NULL,
	"valid_from" date,
	"valid_until" date,
	"conditions" text,
	"min_quantity" integer,
	"validity_proof_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pantry_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"household_id" uuid,
	"product_id" uuid,
	"name" varchar(120) NOT NULL,
	"quantity" real DEFAULT 1 NOT NULL,
	"min_quantity" real,
	"best_before" date,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"country" varchar(2) NOT NULL,
	"threshold_cents" integer NOT NULL,
	"push_consent_at" timestamp with time zone,
	"last_notified_observation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"store_location_id" uuid,
	"price_cents" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'EUR' NOT NULL,
	"price_per" "price_per" DEFAULT 'item' NOT NULL,
	"is_discounted" boolean DEFAULT false NOT NULL,
	"price_without_discount_cents" integer,
	"observed_on" date NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" "data_source" NOT NULL,
	"data_type" "price_data_type" NOT NULL,
	"external_id" varchar(40),
	"proof_url" text,
	"trust" "trust_status" DEFAULT 'unverified' NOT NULL,
	"quality_flags" text[] DEFAULT '{}'::text[] NOT NULL,
	"duplicate_of" uuid,
	"contributor_id" uuid,
	CONSTRAINT "price_obs_positive" CHECK ("price_observations"."price_cents" > 0)
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity_text" varchar(60),
	"package_base" real,
	"dimension" "dimension",
	"variant_group" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(14),
	"category_tag" varchar(120),
	"name" text,
	"brand" text,
	"image_url" text,
	"categories" text[] DEFAULT '{}'::text[] NOT NULL,
	"source" "data_source" DEFAULT 'open_food_facts' NOT NULL,
	"source_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_code_or_category" CHECK ("products"."code" IS NOT NULL OR "products"."category_tag" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"household_id" uuid,
	"store_location_id" uuid,
	"store_name" varchar(80),
	"purchased_on" date NOT NULL,
	"amount_cents" integer NOT NULL,
	"kind" "cost_kind" NOT NULL,
	"category" varchar(40),
	"source" varchar(10) DEFAULT 'manual' NOT NULL,
	"fingerprint" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipt_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_id" uuid NOT NULL,
	"product_id" uuid,
	"raw_text" varchar(200),
	"name" varchar(120) NOT NULL,
	"quantity" real DEFAULT 1 NOT NULL,
	"amount_cents" integer NOT NULL,
	"corrected" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retailers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"countries" varchar(2)[] DEFAULT '{}'::varchar[] NOT NULL,
	"website" text,
	"data_access" varchar(40) DEFAULT 'community_only' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"product_id" uuid,
	"name" varchar(120) NOT NULL,
	"quantity" real DEFAULT 1 NOT NULL,
	"category" varchar(40) DEFAULT '' NOT NULL,
	"price_cents" integer,
	"price_source" "data_source",
	"price_observation_id" uuid,
	"checked" boolean DEFAULT false NOT NULL,
	"favorite" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"household_id" uuid,
	"name" varchar(60) NOT NULL,
	"kind" "list_kind" DEFAULT 'shopping' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"retailer_id" uuid,
	"osm_type" varchar(8),
	"osm_id" varchar(20),
	"open_prices_location_id" integer,
	"name" varchar(160) NOT NULL,
	"city" varchar(120),
	"postcode" varchar(12),
	"country" varchar(2) NOT NULL,
	"lat" real,
	"lon" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contributor_id" uuid,
	"type" "contribution_type" NOT NULL,
	"status" "contribution_status" DEFAULT 'pending' NOT NULL,
	"payload" jsonb NOT NULL,
	"price_observation_id" uuid,
	"moderator_id" uuid,
	"moderated_at" timestamp with time zone,
	"moderation_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(254) NOT NULL,
	"password_hash" text,
	"display_name" varchar(60),
	"locale" varchar(5) DEFAULT 'de' NOT NULL,
	"country" varchar(2) DEFAULT 'DE' NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_user_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_owner_id_user_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_member_id_user_profiles_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_created_by_user_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_price_observation_id_price_observations_id_fk" FOREIGN KEY ("price_observation_id") REFERENCES "public"."price_observations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pantry_items" ADD CONSTRAINT "pantry_items_owner_id_user_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pantry_items" ADD CONSTRAINT "pantry_items_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pantry_items" ADD CONSTRAINT "pantry_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_owner_id_user_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_store_location_id_store_locations_id_fk" FOREIGN KEY ("store_location_id") REFERENCES "public"."store_locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_contributor_id_user_profiles_id_fk" FOREIGN KEY ("contributor_id") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_owner_id_user_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_store_location_id_store_locations_id_fk" FOREIGN KEY ("store_location_id") REFERENCES "public"."store_locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_list_id_shopping_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."shopping_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_price_observation_id_price_observations_id_fk" FOREIGN KEY ("price_observation_id") REFERENCES "public"."price_observations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_updated_by_user_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_owner_id_user_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_locations" ADD CONSTRAINT "store_locations_retailer_id_retailers_id_fk" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_contributions" ADD CONSTRAINT "user_contributions_contributor_id_user_profiles_id_fk" FOREIGN KEY ("contributor_id") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_contributions" ADD CONSTRAINT "user_contributions_price_observation_id_price_observations_id_fk" FOREIGN KEY ("price_observation_id") REFERENCES "public"."price_observations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_contributions" ADD CONSTRAINT "user_contributions_moderator_id_user_profiles_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "budgets_owner_idx" ON "budgets" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "household_members_user_idx" ON "household_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "offers_validity_idx" ON "offers" USING btree ("valid_from","valid_until");--> statement-breakpoint
CREATE INDEX "pantry_items_owner_idx" ON "pantry_items" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "pantry_items_best_before_idx" ON "pantry_items" USING btree ("best_before");--> statement-breakpoint
CREATE INDEX "price_alerts_product_idx" ON "price_alerts" USING btree ("product_id","country");--> statement-breakpoint
CREATE INDEX "price_obs_product_date_idx" ON "price_observations" USING btree ("product_id","observed_on" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "price_obs_store_idx" ON "price_observations" USING btree ("store_location_id","observed_on" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "price_obs_external_uq" ON "price_observations" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "product_variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_variants_group_idx" ON "product_variants" USING btree ("variant_group");--> statement-breakpoint
CREATE UNIQUE INDEX "products_code_uq" ON "products" USING btree ("code");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_tag");--> statement-breakpoint
CREATE INDEX "purchases_owner_date_idx" ON "purchases" USING btree ("owner_id","purchased_on" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "purchases_owner_fingerprint_uq" ON "purchases" USING btree ("owner_id","fingerprint");--> statement-breakpoint
CREATE INDEX "receipt_items_purchase_idx" ON "receipt_items" USING btree ("purchase_id");--> statement-breakpoint
CREATE UNIQUE INDEX "retailers_name_uq" ON "retailers" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "shopping_list_items_list_idx" ON "shopping_list_items" USING btree ("list_id","position");--> statement-breakpoint
CREATE INDEX "shopping_lists_owner_idx" ON "shopping_lists" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "shopping_lists_household_idx" ON "shopping_lists" USING btree ("household_id");--> statement-breakpoint
CREATE UNIQUE INDEX "store_locations_osm_uq" ON "store_locations" USING btree ("osm_type","osm_id");--> statement-breakpoint
CREATE INDEX "store_locations_country_city_idx" ON "store_locations" USING btree ("country","city");--> statement-breakpoint
CREATE INDEX "store_locations_retailer_idx" ON "store_locations" USING btree ("retailer_id");--> statement-breakpoint
CREATE INDEX "user_contributions_status_idx" ON "user_contributions" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_email_uq" ON "user_profiles" USING btree (lower("email"));