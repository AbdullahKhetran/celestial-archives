import { sql } from "drizzle-orm";
import type { EventInput, HardwareInput, LocationInput } from "@/types/seed";
import { closeDatabase, ensureDatabase } from "../db";
import {
  celestialBodies,
  citations,
  events,
  facts,
  hardwareObjects,
  hardwareTypes,
  locationClaims,
  missions,
  sources,
} from "../db/schema";
import {
  hardware,
  hardwareTypes as typeRows,
  missions as missionRows,
  sources as sourceRows,
} from "./catalog";

/** Parents are inserted before children so the hardware foreign key can be set in one pass. */
function orderHardware(items: HardwareInput[]): HardwareInput[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const ordered: HardwareInput[] = [];

  function visit(item: HardwareInput) {
    if (seen.has(item.id)) return;
    if (item.parentId) {
      const parent = byId.get(item.parentId);
      if (!parent) throw new Error(`Missing parent ${item.parentId} for ${item.id}`);
      if (parent.missionId !== item.missionId) {
        throw new Error(`${item.id} is on a different mission from its parent`);
      }
      visit(parent);
    }
    seen.add(item.id);
    ordered.push(item);
  }

  for (const item of items) visit(item);
  return ordered;
}

function requireCoordinates(location: LocationInput, hardwareId: string) {
  if (location.specificity !== "object") return;
  if (location.latitudeDeg === undefined || location.longitudeDeg === undefined) {
    throw new Error(`${hardwareId} has an object location without coordinates`);
  }
  if (location.latitudeDeg < -90 || location.latitudeDeg > 90) {
    throw new Error(`${hardwareId} latitude is out of range`);
  }
  if (location.longitudeDeg < -180 || location.longitudeDeg > 180) {
    throw new Error(`${hardwareId} longitude is out of range`);
  }
}

/** Rejects a seed that would cite a missing source or publish an object pin without numbers. */
function validate(ordered: HardwareInput[]): void {
  const sourceIds = new Set(sourceRows.map((source) => source.id));
  const missionIds = new Set(missionRows.map((mission) => mission.id));
  const typeIds = new Set(typeRows.map((type) => type.id));
  const hardwareIds = new Set<string>();

  if (new Set(missionRows.map((mission) => mission.id)).size !== missionRows.length) {
    throw new Error("Duplicate mission id");
  }

  function checkSources(ids: string[], label: string) {
    for (const id of ids) {
      if (!sourceIds.has(id)) throw new Error(`${label} cites unknown source ${id}`);
    }
  }

  for (const mission of missionRows) {
    checkSources(mission.summarySourceIds, mission.id);
    for (const event of mission.events ?? []) checkSources(event.sourceIds, event.id);
  }

  for (const item of ordered) {
    if (hardwareIds.has(item.id)) throw new Error(`Duplicate hardware id ${item.id}`);
    hardwareIds.add(item.id);
    if (!missionIds.has(item.missionId)) throw new Error(`${item.id} has unknown mission`);
    if (!typeIds.has(item.typeId)) throw new Error(`${item.id} has unknown type ${item.typeId}`);
    checkSources(item.summarySourceIds, item.id);
    const preferred = item.locations.filter((location) => location.isPreferred !== false);
    if (preferred.length !== 1) {
      throw new Error(`${item.id} needs exactly one preferred location`);
    }
    for (const location of item.locations) requireCoordinates(location, item.id);
    for (const location of item.locations) checkSources(location.sourceIds, item.id);
    for (const fact of item.facts ?? []) checkSources(fact.sourceIds, fact.id);
    for (const event of item.events ?? []) {
      checkSources(event.sourceIds, event.id);
      if (event.placesOnSurface && event.precision !== "day") {
        throw new Error(`${event.id} places hardware on the surface without a day`);
      }
    }
  }
}

function unique(ids: string[]) {
  return [...new Set(ids)];
}

async function main() {
  const ordered = orderHardware(hardware);
  validate(ordered);
  const database = await ensureDatabase();

  const locationRows: Array<typeof locationClaims.$inferInsert> = [];
  const eventRows: Array<typeof events.$inferInsert> = [];
  const factRows: Array<typeof facts.$inferInsert> = [];
  const citationRows: Array<typeof citations.$inferInsert> = [];

  function cite(subjectType: string, subjectId: string, sourceIds: string[]) {
    for (const sourceId of unique(sourceIds)) {
      citationRows.push({
        id: `${subjectType}:${subjectId}:${sourceId}`,
        sourceId,
        subjectType,
        subjectId,
      });
    }
  }

  function addEvent(missionId: string, hardwareObjectId: string | null, event: EventInput) {
    eventRows.push({
      id: event.id,
      missionId,
      hardwareObjectId,
      eventType: event.eventType,
      occurredOn: event.occurredOn ?? null,
      precision: event.precision,
      title: event.title,
      summary: event.summary,
      placesOnSurface: event.placesOnSurface ?? false,
    });
    cite("event", event.id, event.sourceIds);
  }

  for (const mission of missionRows) {
    cite("summary", `mission:${mission.id}`, mission.summarySourceIds);
    for (const event of mission.events ?? []) addEvent(mission.id, null, event);
  }

  for (const item of ordered) {
    cite("summary", `hardware:${item.id}`, item.summarySourceIds);
    item.locations.forEach((location, index) => {
      const id = `${item.id}:location:${index}`;
      locationRows.push({
        id,
        hardwareObjectId: item.id,
        latitudeDeg: location.latitudeDeg ?? null,
        longitudeDeg: location.longitudeDeg ?? null,
        elevationM: location.elevationM ?? null,
        uncertaintyM: location.uncertaintyM ?? null,
        referenceFrame: location.referenceFrame ?? null,
        method: location.method,
        specificity: location.specificity,
        isPreferred: location.isPreferred !== false,
        regionName: location.regionName ?? null,
        note: location.note ?? null,
      });
      cite("location", id, location.sourceIds);
    });
    for (const fact of item.facts ?? []) {
      factRows.push({
        id: fact.id,
        hardwareObjectId: item.id,
        label: fact.label,
        value: fact.value,
      });
      cite("fact", fact.id, fact.sourceIds);
    }
    for (const event of item.events ?? []) addEvent(item.missionId, item.id, event);
  }

  await database.transaction(async (tx) => {
    await tx.execute(sql`
      TRUNCATE TABLE
        citations,
        facts,
        events,
        location_claims,
        hardware_objects,
        missions,
        hardware_types,
        sources,
        celestial_bodies
      RESTART IDENTITY CASCADE
    `);
    await tx.insert(celestialBodies).values({ id: "moon", name: "Moon" });
    await tx.insert(sources).values(sourceRows);
    await tx.insert(hardwareTypes).values(typeRows);
    await tx.insert(missions).values(
      missionRows.map((mission) => ({
        id: mission.id,
        celestialBodyId: "moon",
        name: mission.name,
        summary: mission.summary,
      })),
    );
    await tx.insert(hardwareObjects).values(
      ordered.map((item) => ({
        id: item.id,
        missionId: item.missionId,
        parentId: item.parentId ?? null,
        typeId: item.typeId,
        name: item.name,
        restingState: item.restingState,
        condition: item.condition,
        nssdcaId: item.nssdcaId ?? null,
        summary: item.summary,
      })),
    );
    await tx.insert(locationClaims).values(locationRows);
    if (factRows.length > 0) await tx.insert(facts).values(factRows);
    await tx.insert(events).values(eventRows);
    const seenCitations = new Set<string>();
    for (const citation of citationRows) {
      if (seenCitations.has(citation.id)) {
        throw new Error(`Duplicate citation ${citation.id}`);
      }
      seenCitations.add(citation.id);
    }
    for (let index = 0; index < citationRows.length; index += 80) {
      await tx.insert(citations).values(citationRows.slice(index, index + 80));
    }
  });

  console.log(
    `Seeded ${missionRows.length} missions, ${ordered.length} hardware records, ${eventRows.length} events.`,
  );
  await closeDatabase();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
