import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  doublePrecision,
  index,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const celestialBodies = pgTable("celestial_bodies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const missions = pgTable("missions", {
  id: text("id").primaryKey(),
  celestialBodyId: text("celestial_body_id")
    .notNull()
    .references(() => celestialBodies.id),
  name: text("name").notNull(),
  summary: text("summary").notNull(),
});

export const hardwareTypes = pgTable("hardware_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const hardwareObjects = pgTable(
  "hardware_objects",
  {
    id: text("id").primaryKey(),
    missionId: text("mission_id")
      .notNull()
      .references(() => missions.id),
    parentId: text("parent_id").references((): AnyPgColumn => hardwareObjects.id),
    typeId: text("type_id")
      .notNull()
      .references(() => hardwareTypes.id),
    name: text("name").notNull(),
    restingState: text("resting_state").notNull(),
    condition: text("condition").notNull(),
    nssdcaId: text("nssdca_id"),
    summary: text("summary").notNull(),
  },
  (table) => [
    index("hardware_objects_mission_idx").on(table.missionId),
    index("hardware_objects_parent_idx").on(table.parentId),
    check(
      "hardware_resting_state_check",
      sql`${table.restingState} in ('on_surface', 'impacted', 'unknown')`,
    ),
    check(
      "hardware_condition_check",
      sql`${table.condition} in ('inactive', 'partial', 'passive', 'unknown')`,
    ),
  ],
);

export const locationClaims = pgTable(
  "location_claims",
  {
    id: text("id").primaryKey(),
    hardwareObjectId: text("hardware_object_id")
      .notNull()
      .references(() => hardwareObjects.id),
    latitudeDeg: doublePrecision("latitude_deg"),
    longitudeDeg: doublePrecision("longitude_deg"),
    elevationM: doublePrecision("elevation_m"),
    uncertaintyM: doublePrecision("uncertainty_m"),
    referenceFrame: text("reference_frame"),
    method: text("method").notNull(),
    specificity: text("specificity").notNull(),
    isPreferred: boolean("is_preferred").notNull(),
    regionName: text("region_name"),
    note: text("note"),
  },
  (table) => [
    index("location_claims_hardware_idx").on(table.hardwareObjectId),
    uniqueIndex("location_claims_one_preferred")
      .on(table.hardwareObjectId)
      .where(sql`${table.isPreferred} = true`),
    check(
      "location_method_check",
      sql`${table.method} in ('lroc_imaged', 'seismic_estimate', 'literature', 'mission_report', 'catalogue', 'unknown')`,
    ),
    check(
      "location_specificity_check",
      sql`${table.specificity} in ('object', 'site', 'unknown')`,
    ),
  ],
);

export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    missionId: text("mission_id")
      .notNull()
      .references(() => missions.id),
    hardwareObjectId: text("hardware_object_id").references(() => hardwareObjects.id),
    eventType: text("event_type").notNull(),
    occurredOn: date("occurred_on"),
    precision: text("precision").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    placesOnSurface: boolean("places_on_surface").notNull(),
  },
  (table) => [
    index("events_mission_idx").on(table.missionId),
    index("events_hardware_idx").on(table.hardwareObjectId),
    index("events_occurred_on_idx").on(table.occurredOn),
    check(
      "events_precision_check",
      sql`${table.precision} in ('day', 'unknown')`,
    ),
    check(
      "events_date_check",
      sql`(${table.precision} = 'day' and ${table.occurredOn} is not null) or (${table.precision} = 'unknown' and ${table.occurredOn} is null)`,
    ),
    check(
      "events_type_check",
      sql`${table.eventType} in ('launch', 'landing', 'impact', 'deployment', 'liftoff', 'jettison', 'last_contact', 'shutdown')`,
    ),
  ],
);

export const facts = pgTable(
  "facts",
  {
    id: text("id").primaryKey(),
    hardwareObjectId: text("hardware_object_id")
      .notNull()
      .references(() => hardwareObjects.id),
    label: text("label").notNull(),
    value: text("value").notNull(),
  },
  (table) => [index("facts_hardware_idx").on(table.hardwareObjectId)],
);

export const sources = pgTable("sources", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  publisher: text("publisher").notNull(),
});

export const citations = pgTable(
  "citations",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    subjectType: text("subject_type").notNull(),
    subjectId: text("subject_id").notNull(),
  },
  (table) => [
    uniqueIndex("citations_subject_source_unique").on(
      table.subjectType,
      table.subjectId,
      table.sourceId,
    ),
    check(
      "citations_subject_check",
      sql`${table.subjectType} in ('summary', 'fact', 'location', 'event')`,
    ),
  ],
);
