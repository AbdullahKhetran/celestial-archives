import { connection } from "next/server";
import { cache } from "react";
import { ensureDatabase } from "../db";
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
import { assembleArchive, hardwareDetail, missionDetail, type ArchiveRows } from "./assemble";

/** One cached read per request. Pages and routes share it so the archive is not queried nine times. */
export const loadRows = cache(async (): Promise<ArchiveRows> => {
  await connection();
  const database = await ensureDatabase();
  const [bodies, missionRows, types, hardware, locations, eventRows, factRows, sourceRows, citationRows] =
    await Promise.all([
      database.select().from(celestialBodies),
      database.select().from(missions),
      database.select().from(hardwareTypes),
      database.select().from(hardwareObjects),
      database.select().from(locationClaims),
      database.select().from(events),
      database.select().from(facts),
      database.select().from(sources),
      database.select().from(citations),
    ]);

  return {
    bodies,
    missions: missionRows,
    types,
    hardware,
    locations,
    events: eventRows,
    facts: factRows,
    sources: sourceRows,
    citations: citationRows,
  };
});

export async function loadArchive(bodyId = "moon") {
  return assembleArchive(await loadRows(), bodyId);
}

/** Unknown ids are null so a route can answer 404. A missing database still throws. */
export async function loadBody(bodyId = "moon") {
  try {
    return await loadArchive(bodyId);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("No celestial body has id ")) return null;
    throw error;
  }
}

export async function loadHardware(id: string) {
  return hardwareDetail(await loadRows(), id);
}

export async function loadMission(id: string) {
  return missionDetail(await loadRows(), id);
}
