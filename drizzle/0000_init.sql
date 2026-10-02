CREATE TABLE "share_rate_limits" (
	"key_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"card_type" text NOT NULL,
	"theme" text NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"payload" jsonb NOT NULL,
	"delete_token_hash" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "share_rate_limits_key_created_idx" ON "share_rate_limits" USING btree ("key_hash","created_at");