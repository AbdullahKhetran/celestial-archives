import "server-only";

import { and, asc, eq, ne } from "drizzle-orm";
import {
  conditionLabels,
  eventTypeLabels,
  methodLabels,
  restingLabels,
  specificityLabels,
} from "@/constants/labels";
import { ensureDatabase } from "@/app/lib/db";
import {
  celestialBodies,
  events,
  facts,
  hardwareObjects,
  hardwareTypes,
  locationClaims,
  missions,
} from "@/app/lib/db/schema";
import type { StoryEventRecord, StoryGenerationInput } from "./generate";

function named(labels: Record<string, string>, code: string): string {
  return labels[code] ?? code;
}

function toStoryEvent(event: {
  title: string;
  eventType: string;
  occurredOn: string | null;
  precision: string;
  summary: string;
  placesOnSurface: boolean;
}): StoryEventRecord {
  return {
    title: event.title,
    eventType: event.eventType,
    eventLabel: named(eventTypeLabels, event.eventType),
    occurredOn: event.occurredOn,
    precision: event.precision === "day" ? "day" : "unknown",
    summary: event.summary,
    placesOnSurface: event.placesOnSurface,
  };
}

/**
 * Retrieves the factual context for one event.
 *
 * Loads the world, the mission, and, when the event belongs to an object,
 * that object's type, parent, preferred place, facts, and other events.
 * Those fields are what the archive actually knows about hardware left behind.
 * Does not assemble the whole catalog.
 */
export async function loadStoryGenerationInput(
  eventId: string,
): Promise<StoryGenerationInput | null> {
  const database = await ensureDatabase();

  const [event] = await database
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    return null;
  }

  const [mission] = await database
    .select()
    .from(missions)
    .where(eq(missions.id, event.missionId))
    .limit(1);

  if (!mission) {
    throw new Error(`Mission not found for event ${eventId}.`);
  }

  const [body] = await database
    .select()
    .from(celestialBodies)
    .where(eq(celestialBodies.id, mission.celestialBodyId))
    .limit(1);

  if (!body) {
    throw new Error(`Celestial body not found for event ${eventId}.`);
  }

  let hardware: StoryGenerationInput["hardware"] = null;

  if (event.hardwareObjectId) {
    const [hardwareRecord] = await database
      .select()
      .from(hardwareObjects)
      .where(eq(hardwareObjects.id, event.hardwareObjectId))
      .limit(1);

    if (!hardwareRecord) {
      throw new Error(`Hardware record not found for event ${eventId}.`);
    }

    const [hardwareType] = await database
      .select()
      .from(hardwareTypes)
      .where(eq(hardwareTypes.id, hardwareRecord.typeId))
      .limit(1);

    if (!hardwareType) {
      throw new Error(`Hardware type not found for event ${eventId}.`);
    }

    let parentName: string | null = null;

    if (hardwareRecord.parentId) {
      const [parent] = await database
        .select({ name: hardwareObjects.name })
        .from(hardwareObjects)
        .where(eq(hardwareObjects.id, hardwareRecord.parentId))
        .limit(1);

      if (!parent) {
        throw new Error(`Parent hardware not found for event ${eventId}.`);
      }

      parentName = parent.name;
    }

    const [place] = await database
      .select()
      .from(locationClaims)
      .where(
        and(
          eq(locationClaims.hardwareObjectId, hardwareRecord.id),
          eq(locationClaims.isPreferred, true),
        ),
      )
      .limit(1);

    const factRows = await database
      .select({ label: facts.label, value: facts.value })
      .from(facts)
      .where(eq(facts.hardwareObjectId, hardwareRecord.id))
      .orderBy(asc(facts.id));

    const otherEventRows = await database
      .select()
      .from(events)
      .where(
        and(
          eq(events.hardwareObjectId, hardwareRecord.id),
          ne(events.id, event.id),
        ),
      )
      .orderBy(asc(events.occurredOn));

    hardware = {
      name: hardwareRecord.name,
      summary: hardwareRecord.summary,
      typeName: hardwareType.name,
      restingState: hardwareRecord.restingState,
      restingLabel: named(restingLabels, hardwareRecord.restingState),
      condition: hardwareRecord.condition,
      conditionLabel: named(conditionLabels, hardwareRecord.condition),
      parentName,
      place: place
        ? {
            regionName: place.regionName,
            latitudeDeg: place.latitudeDeg,
            longitudeDeg: place.longitudeDeg,
            methodLabel: named(methodLabels, place.method),
            specificityLabel: named(specificityLabels, place.specificity),
            note: place.note,
          }
        : null,
      facts: factRows,
      otherEvents: otherEventRows.map(toStoryEvent),
    };
  }

  return {
    body: { name: body.name },
    event: toStoryEvent(event),
    mission: {
      name: mission.name,
      summary: mission.summary,
    },
    hardware,
  };
}
