CREATE TABLE "celestial_bodies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "citations" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	CONSTRAINT "citations_subject_check" CHECK ("citations"."subject_type" in ('summary', 'fact', 'location', 'event'))
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"mission_id" text NOT NULL,
	"hardware_object_id" text,
	"event_type" text NOT NULL,
	"occurred_on" date,
	"precision" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"places_on_surface" boolean NOT NULL,
	CONSTRAINT "events_precision_check" CHECK ("events"."precision" in ('day', 'unknown')),
	CONSTRAINT "events_date_check" CHECK (("events"."precision" = 'day' and "events"."occurred_on" is not null) or ("events"."precision" = 'unknown' and "events"."occurred_on" is null)),
	CONSTRAINT "events_type_check" CHECK ("events"."event_type" in ('launch', 'landing', 'impact', 'deployment', 'liftoff', 'jettison', 'last_contact', 'shutdown'))
);
--> statement-breakpoint
CREATE TABLE "facts" (
	"id" text PRIMARY KEY NOT NULL,
	"hardware_object_id" text NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hardware_objects" (
	"id" text PRIMARY KEY NOT NULL,
	"mission_id" text NOT NULL,
	"parent_id" text,
	"type_id" text NOT NULL,
	"name" text NOT NULL,
	"resting_state" text NOT NULL,
	"condition" text NOT NULL,
	"nssdca_id" text,
	"summary" text NOT NULL,
	CONSTRAINT "hardware_resting_state_check" CHECK ("hardware_objects"."resting_state" in ('on_surface', 'impacted', 'unknown')),
	CONSTRAINT "hardware_condition_check" CHECK ("hardware_objects"."condition" in ('inactive', 'partial', 'passive', 'unknown'))
);
--> statement-breakpoint
CREATE TABLE "hardware_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location_claims" (
	"id" text PRIMARY KEY NOT NULL,
	"hardware_object_id" text NOT NULL,
	"latitude_deg" double precision,
	"longitude_deg" double precision,
	"elevation_m" double precision,
	"uncertainty_m" double precision,
	"reference_frame" text,
	"method" text NOT NULL,
	"specificity" text NOT NULL,
	"is_preferred" boolean NOT NULL,
	"region_name" text,
	"note" text,
	CONSTRAINT "location_method_check" CHECK ("location_claims"."method" in ('lroc_imaged', 'seismic_estimate', 'literature', 'mission_report', 'catalogue', 'unknown')),
	CONSTRAINT "location_specificity_check" CHECK ("location_claims"."specificity" in ('object', 'site', 'unknown'))
);
--> statement-breakpoint
CREATE TABLE "missions" (
	"id" text PRIMARY KEY NOT NULL,
	"celestial_body_id" text NOT NULL,
	"name" text NOT NULL,
	"summary" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"publisher" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_hardware_object_id_hardware_objects_id_fk" FOREIGN KEY ("hardware_object_id") REFERENCES "public"."hardware_objects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facts" ADD CONSTRAINT "facts_hardware_object_id_hardware_objects_id_fk" FOREIGN KEY ("hardware_object_id") REFERENCES "public"."hardware_objects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hardware_objects" ADD CONSTRAINT "hardware_objects_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hardware_objects" ADD CONSTRAINT "hardware_objects_parent_id_hardware_objects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."hardware_objects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hardware_objects" ADD CONSTRAINT "hardware_objects_type_id_hardware_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."hardware_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_claims" ADD CONSTRAINT "location_claims_hardware_object_id_hardware_objects_id_fk" FOREIGN KEY ("hardware_object_id") REFERENCES "public"."hardware_objects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_celestial_body_id_celestial_bodies_id_fk" FOREIGN KEY ("celestial_body_id") REFERENCES "public"."celestial_bodies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "citations_subject_source_unique" ON "citations" USING btree ("subject_type","subject_id","source_id");--> statement-breakpoint
CREATE INDEX "events_mission_idx" ON "events" USING btree ("mission_id");--> statement-breakpoint
CREATE INDEX "events_hardware_idx" ON "events" USING btree ("hardware_object_id");--> statement-breakpoint
CREATE INDEX "events_occurred_on_idx" ON "events" USING btree ("occurred_on");--> statement-breakpoint
CREATE INDEX "facts_hardware_idx" ON "facts" USING btree ("hardware_object_id");--> statement-breakpoint
CREATE INDEX "hardware_objects_mission_idx" ON "hardware_objects" USING btree ("mission_id");--> statement-breakpoint
CREATE INDEX "hardware_objects_parent_idx" ON "hardware_objects" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "location_claims_hardware_idx" ON "location_claims" USING btree ("hardware_object_id");--> statement-breakpoint
CREATE UNIQUE INDEX "location_claims_one_preferred" ON "location_claims" USING btree ("hardware_object_id") WHERE "location_claims"."is_preferred" = true;