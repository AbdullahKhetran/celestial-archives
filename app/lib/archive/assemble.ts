import {
  conditionLabels,
  methodLabels,
  restingLabels,
  specificityLabels,
} from "@/constants/labels";
import type {
  ArchiveSnapshot,
  Citation,
  EventDetail,
  HardwareDetail,
  HardwareListItem,
  LocationDetail,
  MissionDetail,
  Pin,
} from "@/types/archive";
import type {
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

type BodyRow = typeof celestialBodies.$inferSelect;
type MissionRow = typeof missions.$inferSelect;
type TypeRow = typeof hardwareTypes.$inferSelect;
type HardwareRow = typeof hardwareObjects.$inferSelect;
type LocationRow = typeof locationClaims.$inferSelect;
type EventRow = typeof events.$inferSelect;
type FactRow = typeof facts.$inferSelect;
type SourceRow = typeof sources.$inferSelect;
type CitationRow = typeof citations.$inferSelect;

export type ArchiveRows = {
  bodies: BodyRow[];
  missions: MissionRow[];
  types: TypeRow[];
  hardware: HardwareRow[];
  locations: LocationRow[];
  events: EventRow[];
  facts: FactRow[];
  sources: SourceRow[];
  citations: CitationRow[];
};

function specificityOf(value: string): "object" | "site" | "unknown" {
  if (value === "site" || value === "unknown") return value;
  return "object";
}

function citationsFor(
  rows: CitationRow[],
  sourcesById: Map<string, SourceRow>,
  subjectType: string,
  subjectId: string,
): Citation[] {
  return rows
    .filter((row) => row.subjectType === subjectType && row.subjectId === subjectId)
    .map((row) => {
      const source = sourcesById.get(row.sourceId);
      if (!source) throw new Error(`Missing source ${row.sourceId}`);
      return {
        sourceId: source.id,
        title: source.title,
        url: source.url,
        publisher: source.publisher,
      };
    });
}

/**
 * Prefers an object's own coordinate. Otherwise walks parents so a part can
 * appear at the station that actually has a published pin.
 */
function resolvePin(
  item: HardwareRow,
  byId: Map<string, HardwareRow>,
  preferredByHardware: Map<string, LocationRow>,
): Pin | null {
  const own = preferredByHardware.get(item.id);
  if (
    own &&
    own.specificity === "object" &&
    own.latitudeDeg !== null &&
    own.longitudeDeg !== null
  ) {
    return {
      latitudeDeg: own.latitudeDeg,
      longitudeDeg: own.longitudeDeg,
      specificity: "object",
      inheritedFrom: null,
    };
  }

  let parentId = item.parentId;
  const seen = new Set<string>([item.id]);
  while (parentId) {
    if (seen.has(parentId)) break;
    seen.add(parentId);
    const parent = byId.get(parentId);
    if (!parent) break;
    const parentLocation = preferredByHardware.get(parent.id);
    if (
      parentLocation &&
      parentLocation.specificity === "object" &&
      parentLocation.latitudeDeg !== null &&
      parentLocation.longitudeDeg !== null
    ) {
      return {
        latitudeDeg: parentLocation.latitudeDeg,
        longitudeDeg: parentLocation.longitudeDeg,
        specificity: "site",
        inheritedFrom: { id: parent.id, name: parent.name },
      };
    }
    parentId = parent.parentId;
  }
  return null;
}

/**
 * Builds one world's snapshot. The map, ledger, and list routes all read it.
 * An empty database names the seed command. An unknown id does not, so the API can return 404.
 */
export function assembleArchive(rows: ArchiveRows, bodyId = "moon"): ArchiveSnapshot {
  const body = rows.bodies.find((item) => item.id === bodyId);
  if (!body) {
    if (rows.bodies.length === 0) {
      throw new Error("The archive is not in the database. Run npm run db:seed.");
    }
    throw new Error(`No celestial body has id ${bodyId}.`);
  }

  const sourcesById = new Map(rows.sources.map((source) => [source.id, source]));
  const missionsById = new Map(rows.missions.map((mission) => [mission.id, mission]));
  const typesById = new Map(rows.types.map((type) => [type.id, type]));
  const hardwareById = new Map(rows.hardware.map((item) => [item.id, item]));
  const preferredByHardware = new Map<string, LocationRow>();
  for (const location of rows.locations) {
    if (location.isPreferred) preferredByHardware.set(location.hardwareObjectId, location);
  }

  const arrivalByHardware = new Map<string, string>();
  for (const event of rows.events) {
    if (!event.hardwareObjectId || !event.placesOnSurface || !event.occurredOn) continue;
    const current = arrivalByHardware.get(event.hardwareObjectId);
    if (!current || event.occurredOn < current) {
      arrivalByHardware.set(event.hardwareObjectId, event.occurredOn);
    }
  }

  const hardware: HardwareListItem[] = rows.hardware
    .filter((item) => missionsById.get(item.missionId)?.celestialBodyId === body.id)
    .map((item) => {
      const mission = missionsById.get(item.missionId);
      const type = typesById.get(item.typeId);
      if (!mission || !type) throw new Error(`Broken link on ${item.id}`);
      const parent = item.parentId ? hardwareById.get(item.parentId) : undefined;
      return {
        id: item.id,
        name: item.name,
        summary: item.summary,
        restingState: item.restingState,
        restingLabel: restingLabels[item.restingState] ?? item.restingState,
        condition: item.condition,
        conditionLabel: conditionLabels[item.condition] ?? item.condition,
        type: { id: type.id, name: type.name },
        mission: { id: mission.id, name: mission.name },
        parent: parent ? { id: parent.id, name: parent.name } : null,
        pin: resolvePin(item, hardwareById, preferredByHardware),
        arrivedOn: arrivalByHardware.get(item.id) ?? null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const hardwareByMission = new Map<string, HardwareListItem[]>();
  for (const item of hardware) {
    const list = hardwareByMission.get(item.mission.id) ?? [];
    list.push(item);
    hardwareByMission.set(item.mission.id, list);
  }

  const missions = rows.missions
    .filter((mission) => mission.celestialBodyId === body.id)
    .map((mission) => {
      const items = hardwareByMission.get(mission.id) ?? [];
      return {
        id: mission.id,
        name: mission.name,
        summary: mission.summary,
        summaryCitations: citationsFor(rows.citations, sourcesById, "summary", `mission:${mission.id}`),
        hardwareCount: items.length,
        pinnedCount: items.filter((item) => item.pin).length,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const bodyMissionIds = new Set(missions.map((mission) => mission.id));
  const usedTypeIds = new Set(hardware.map((item) => item.type.id));

  const timeline: EventDetail[] = rows.events
    .filter((event) => bodyMissionIds.has(event.missionId))
    .map((event) => {
      const mission = missionsById.get(event.missionId);
      if (!mission) throw new Error(`Event ${event.id} has no mission`);
      const hardwareRow = event.hardwareObjectId
        ? hardwareById.get(event.hardwareObjectId)
        : undefined;
      return {
        id: event.id,
        eventType: event.eventType,
        occurredOn: event.occurredOn,
        precision: event.precision === "unknown" ? "unknown" : "day",
        title: event.title,
        summary: event.summary,
        placesOnSurface: event.placesOnSurface,
        mission: { id: mission.id, name: mission.name },
        hardware: hardwareRow ? { id: hardwareRow.id, name: hardwareRow.name } : null,
        citations: citationsFor(rows.citations, sourcesById, "event", event.id),
      } satisfies EventDetail;
    })
    .sort((a, b) => {
      if (a.occurredOn && b.occurredOn) return a.occurredOn.localeCompare(b.occurredOn);
      if (a.occurredOn) return -1;
      if (b.occurredOn) return 1;
      return a.title.localeCompare(b.title);
    });

  return {
    body: { id: body.id, name: body.name },
    missions,
    types: rows.types
      .filter((type) => usedTypeIds.has(type.id))
      .map((type) => ({ id: type.id, name: type.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    hardware,
    timeline,
  };
}

export function hardwareDetail(rows: ArchiveRows, id: string): HardwareDetail | null {
  const record = rows.hardware.find((hardwareItem) => hardwareItem.id === id);
  const mission = record ? rows.missions.find((item) => item.id === record.missionId) : undefined;
  if (!record || !mission) return null;
  const snapshot = assembleArchive(rows, mission.celestialBodyId);
  const item = snapshot.hardware.find((hardwareItem) => hardwareItem.id === id);
  if (!item) return null;

  const sourcesById = new Map(rows.sources.map((source) => [source.id, source]));
  const locations: LocationDetail[] = rows.locations
    .filter((location) => location.hardwareObjectId === id)
    .map((location) => ({
      latitudeDeg: location.latitudeDeg,
      longitudeDeg: location.longitudeDeg,
      elevationM: location.elevationM,
      uncertaintyM: location.uncertaintyM,
      referenceFrame: location.referenceFrame,
      method: location.method,
      methodLabel: methodLabels[location.method] ?? location.method,
      specificity: specificityOf(location.specificity),
      specificityLabel: specificityLabels[location.specificity] ?? location.specificity,
      isPreferred: location.isPreferred,
      regionName: location.regionName,
      note: location.note,
      citations: citationsFor(rows.citations, sourcesById, "location", location.id),
    }))
    .sort((a, b) => Number(b.isPreferred) - Number(a.isPreferred));

  return {
    ...item,
    body: snapshot.body,
    nssdcaId: record.nssdcaId,
    summaryCitations: citationsFor(rows.citations, sourcesById, "summary", `hardware:${id}`),
    locations,
    facts: rows.facts
      .filter((fact) => fact.hardwareObjectId === id)
      .map((fact) => ({
        id: fact.id,
        label: fact.label,
        value: fact.value,
        citations: citationsFor(rows.citations, sourcesById, "fact", fact.id),
      })),
    events: snapshot.timeline.filter((event) => event.hardware?.id === id),
    children: snapshot.hardware
      .filter((child) => child.parent?.id === id)
      .map((child) => ({
        id: child.id,
        name: child.name,
        typeName: child.type.name,
        pin: child.pin,
      })),
  };
}

export function missionDetail(rows: ArchiveRows, id: string): MissionDetail | null {
  const missionRow = rows.missions.find((item) => item.id === id);
  if (!missionRow) return null;
  const snapshot = assembleArchive(rows, missionRow.celestialBodyId);
  const mission = snapshot.missions.find((item) => item.id === id);
  if (!mission) return null;
  return {
    ...mission,
    body: snapshot.body,
    hardware: snapshot.hardware
      .filter((item) => item.mission.id === id)
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}
