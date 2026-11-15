export type LocationMethod =
  | "lroc_imaged"
  | "seismic_estimate"
  | "literature"
  | "mission_report"
  | "catalogue"
  | "unknown";

export type LocationInput = {
  latitudeDeg?: number;
  longitudeDeg?: number;
  elevationM?: number;
  uncertaintyM?: number;
  referenceFrame?: string;
  method: LocationMethod;
  specificity: "object" | "site" | "unknown";
  isPreferred?: boolean;
  regionName?: string;
  note?: string;
  sourceIds: string[];
};

export type EventInput = {
  id: string;
  eventType:
    | "launch"
    | "landing"
    | "impact"
    | "deployment"
    | "liftoff"
    | "jettison"
    | "last_contact"
    | "shutdown";
  occurredOn?: string;
  precision: "day" | "unknown";
  title: string;
  summary: string;
  placesOnSurface?: boolean;
  sourceIds: string[];
};

export type FactInput = {
  id: string;
  label: string;
  value: string;
  sourceIds: string[];
};

export type HardwareInput = {
  id: string;
  missionId: string;
  parentId?: string;
  typeId: string;
  name: string;
  restingState: "on_surface" | "impacted" | "unknown";
  condition: "inactive" | "partial" | "passive" | "unknown";
  nssdcaId?: string;
  summary: string;
  summarySourceIds: string[];
  facts?: FactInput[];
  locations: LocationInput[];
  events?: EventInput[];
};

export type MissionInput = {
  id: string;
  celestialBodyId?: string;
  name: string;
  summary: string;
  summarySourceIds: string[];
  events?: EventInput[];
};

export type SourceInput = {
  id: string;
  title: string;
  url: string;
  publisher: string;
};
