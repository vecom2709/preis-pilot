CREATE TYPE "public"."billing_cycle" AS ENUM('weekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."household_category" AS ENUM('food', 'household', 'electronics', 'multimedia', 'streaming', 'gaming', 'digital', 'other');--> statement-breakpoint
CREATE TYPE "public"."media_availability" AS ENUM('in_stock', 'limited', 'out_of_stock', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."media_condition" AS ENUM('new', 'used', 'refurbished', 'demo', 'digital', 'subscription');--> statement-breakpoint
CREATE TYPE "public"."notice_unit" AS ENUM('days', 'weeks', 'months');--> statement-breakpoint
CREATE TYPE "public"."offer_source" AS ENUM('manual', 'feed', 'affiliate', 'partner_api');--> statement-breakpoint
CREATE TYPE "public"."source_state" AS ENUM('active', 'needs_key', 'disabled', 'error');--> statement-breakpoint
CREATE TYPE "public"."sub_category" AS ENUM('video', 'music', 'gaming', 'cloud', 'software', 'productivity', 'media', 'other');--> statement-breakpoint
CREATE TYPE "public"."sub_status" AS ENUM('active', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."title_type" AS ENUM('movie', 'series');--> statement-breakpoint
CREATE TYPE "public"."usage_level" AS ENUM('often', 'sometimes', 'rarely', 'never');--> statement-breakpoint
CREATE TABLE "data_source_connections" (
	"key" varchar(40) PRIMARY KEY NOT NULL,
	"label" varchar(80) NOT NULL,
	"state" "source_state" DEFAULT 'disabled' NOT NULL,
	"license" varchar(80),
	"last_sync_at" timestamp with time zone,
	"last_error" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_plan_allocations" (
	"plan_id" uuid NOT NULL,
	"category" "household_category" NOT NULL,
	"cents" integer NOT NULL,
	CONSTRAINT "household_plan_allocations_plan_id_category_pk" PRIMARY KEY("plan_id","category")
);
--> statement-breakpoint
CREATE TABLE "household_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"month" date NOT NULL,
	"total_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(40) NOT NULL,
	"spec_schema" varchar(20) NOT NULL,
	"brand" varchar(60) NOT NULL,
	"name" varchar(120) NOT NULL,
	"model" varchar(60) NOT NULL,
	"model_normalized" varchar(60) NOT NULL,
	"variant_key" varchar(200) DEFAULT '' NOT NULL,
	"specs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"spec_source_url" text,
	"image_url" text,
	"ean" varchar(14),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_titles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_source" varchar(20) NOT NULL,
	"external_id" varchar(40) NOT NULL,
	"type" "title_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"year" integer,
	"attribution" text NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchant_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_product_id" uuid NOT NULL,
	"merchant_id" uuid NOT NULL,
	"url" text,
	"price_cents" integer NOT NULL,
	"shipping_cents" integer,
	"condition" "media_condition" NOT NULL,
	"availability" "media_availability" DEFAULT 'unknown' NOT NULL,
	"warranty_months" integer,
	"promo" text,
	"observed_at" timestamp with time zone NOT NULL,
	"source" "offer_source" NOT NULL,
	"sponsored" boolean DEFAULT false NOT NULL,
	"reported_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "merchant_offers_price_nonneg" CHECK ("merchant_offers"."price_cents" >= 0 AND ("merchant_offers"."shipping_cents" IS NULL OR "merchant_offers"."shipping_cents" >= 0))
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"website" text,
	"country" varchar(2),
	"imprint_url" text,
	"imprint_checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_watches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"media_product_id" uuid NOT NULL,
	"threshold_cents" integer NOT NULL,
	"condition" "media_condition" DEFAULT 'new' NOT NULL,
	"push_consent_at" timestamp with time zone,
	"last_notified_offer_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_watches_threshold_pos" CHECK ("product_watches"."threshold_cents" > 0)
);
--> statement-breakpoint
CREATE TABLE "savings_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"household_id" uuid,
	"name" varchar(60) NOT NULL,
	"target_cents" integer NOT NULL,
	"saved_cents" integer DEFAULT 0 NOT NULL,
	"monthly_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "savings_goals_target_pos" CHECK ("savings_goals"."target_cents" > 0)
);
--> statement-breakpoint
CREATE TABLE "streaming_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_id" uuid NOT NULL,
	"country" varchar(2) NOT NULL,
	"provider" varchar(80) NOT NULL,
	"offer_type" varchar(20) NOT NULL,
	"checked_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_price_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"valid_from" date NOT NULL,
	"price_cents" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"household_id" uuid,
	"name" varchar(60) NOT NULL,
	"category" "sub_category" NOT NULL,
	"price_cents" integer NOT NULL,
	"cycle" "billing_cycle" NOT NULL,
	"start_date" date NOT NULL,
	"min_term_months" integer,
	"renewal_months" integer,
	"notice_value" integer,
	"notice_unit" "notice_unit",
	"status" "sub_status" DEFAULT 'active' NOT NULL,
	"ends_on" date,
	"usage" "usage_level",
	"yearly_option_cents" integer,
	"family_price_cents" integer,
	"family_people" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_price_nonneg" CHECK ("subscriptions"."price_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "wishlist_items" (
	"owner_id" uuid NOT NULL,
	"media_product_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wishlist_items_owner_id_media_product_id_pk" PRIMARY KEY("owner_id","media_product_id")
);
--> statement-breakpoint
ALTER TABLE "household_plan_allocations" ADD CONSTRAINT "household_plan_allocations_plan_id_household_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."household_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_plans" ADD CONSTRAINT "household_plans_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_offers" ADD CONSTRAINT "merchant_offers_media_product_id_media_products_id_fk" FOREIGN KEY ("media_product_id") REFERENCES "public"."media_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_offers" ADD CONSTRAINT "merchant_offers_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_offers" ADD CONSTRAINT "merchant_offers_reported_by_user_profiles_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_watches" ADD CONSTRAINT "product_watches_owner_id_user_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_watches" ADD CONSTRAINT "product_watches_media_product_id_media_products_id_fk" FOREIGN KEY ("media_product_id") REFERENCES "public"."media_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_owner_id_user_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaming_availability" ADD CONSTRAINT "streaming_availability_title_id_media_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."media_titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_price_changes" ADD CONSTRAINT "subscription_price_changes_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_owner_id_user_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_owner_id_user_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_media_product_id_media_products_id_fk" FOREIGN KEY ("media_product_id") REFERENCES "public"."media_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "household_plans_month_uq" ON "household_plans" USING btree ("household_id","month");--> statement-breakpoint
CREATE UNIQUE INDEX "media_products_variant_uq" ON "media_products" USING btree (lower("brand"),"model_normalized","variant_key");--> statement-breakpoint
CREATE INDEX "media_products_category_idx" ON "media_products" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "media_titles_ext_uq" ON "media_titles" USING btree ("external_source","external_id");--> statement-breakpoint
CREATE INDEX "merchant_offers_product_idx" ON "merchant_offers" USING btree ("media_product_id","condition","observed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "merchants_name_uq" ON "merchants" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "product_watches_product_idx" ON "product_watches" USING btree ("media_product_id");--> statement-breakpoint
CREATE INDEX "streaming_availability_title_idx" ON "streaming_availability" USING btree ("title_id","country");--> statement-breakpoint
CREATE INDEX "subscription_price_changes_sub_idx" ON "subscription_price_changes" USING btree ("subscription_id","valid_from");--> statement-breakpoint
CREATE INDEX "subscriptions_owner_idx" ON "subscriptions" USING btree ("owner_id","status");