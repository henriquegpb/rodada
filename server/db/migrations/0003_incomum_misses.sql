CREATE TABLE "incomum_misses" (
	"category" text NOT NULL,
	"key" text NOT NULL,
	"text" text NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "incomum_misses_category_key_pk" PRIMARY KEY("category","key")
);
--> statement-breakpoint
CREATE INDEX "incomum_misses_count_idx" ON "incomum_misses" USING btree ("category","count");