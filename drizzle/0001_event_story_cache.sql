CREATE TABLE "event_story_cache" (
	"event_id" text PRIMARY KEY NOT NULL,
	"source_fingerprint" text NOT NULL,
	"prompt_version" text NOT NULL,
	"model" text NOT NULL,
	"story" jsonb NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_story_cache" ADD CONSTRAINT "event_story_cache_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;