
import "server-only";

import { eq } from "drizzle-orm";
import { ensureDatabase } from "@/app/lib/db";
import {
  events,
  missions,
  hardwareObjects,
  hardwareTypes,
} from "@/app/lib/db/schema";
import type { StoryGenerationInput } from "./generate";

/**
 * Retrieves the factual context for one event.
 *
 * Supports both:
 * - Events associated with hardware.
 * - Mission-level events without associated hardware.
 *
 * Does not load or assemble the complete archive.
 */
export async function loadStoryGenerationInput(
  eventId: string,
): Promise<StoryGenerationInput | null> {
  const database = await ensureDatabase();

  // 1. Find the requested event.
  const [event] = await database
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    return null;
  }

  // 2. Retrieve its mission.
  const [mission] = await database
    .select()
    .from(missions)
    .where(eq(missions.id, event.missionId))
    .limit(1);

  if (!mission) {
    throw new Error(`Mission not found for event ${eventId}.`);
  }

  // 3. Retrieve associated hardware, if available.
  let hardware: StoryGenerationInput["hardware"] = null;

  if (event.hardwareObjectId) {
    const [hardwareRecord] = await database
      .select()
      .from(hardwareObjects)
      .where(eq(hardwareObjects.id, event.hardwareObjectId))
      .limit(1);

    if (!hardwareRecord) {
      throw new Error(
        `Hardware record not found for event ${eventId}.`,
      );
    }

    // 4. Retrieve the hardware type.
    const [hardwareType] = await database
      .select()
      .from(hardwareTypes)
      .where(eq(hardwareTypes.id, hardwareRecord.typeId))
      .limit(1);

    if (!hardwareType) {
      throw new Error(
        `Hardware type not found for event ${eventId}.`,
      );
    }

    hardware = {
      name: hardwareRecord.name,
      summary: hardwareRecord.summary,
      typeName: hardwareType.name,
      restingState: hardwareRecord.restingState,
      condition: hardwareRecord.condition,
    };
  }

  // 5. Return the normalized context expected by Gemini.
  return {
    event: {
      title: event.title,
      eventType: event.eventType,
      occurredOn: event.occurredOn,
      precision: event.precision === "day" ? "day" : "unknown",
      summary: event.summary,
      placesOnSurface: event.placesOnSurface,
    },

    mission: {
      name: mission.name,
      summary: mission.summary,
    },

    hardware,
  };
}
