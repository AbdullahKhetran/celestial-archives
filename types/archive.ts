export type Citation = {
  sourceId: string;
  title: string;
  url: string;
  publisher: string;
};

export type Pin = {
  latitudeDeg: number;
  longitudeDeg: number;
  specificity: "object" | "site";
  inheritedFrom: { id: string; name: string } | null;
};

export type HardwareListItem = {
  id: string;
  name: string;
  summary: string;
  restingState: string;
  restingLabel: string;
  condition: string;
  conditionLabel: string;
  type: { id: string; name: string };
  mission: { id: string; name: string };
  parent: { id: string; name: string } | null;
  pin: Pin | null;
  arrivedOn: string | null;
};

export type LocationDetail = {
  latitudeDeg: number | null;
  longitudeDeg: number | null;
  elevationM: number | null;
  uncertaintyM: number | null;
  referenceFrame: string | null;
  method: string;
  methodLabel: string;
  specificity: "object" | "site" | "unknown";
  specificityLabel: string;
  isPreferred: boolean;
  regionName: string | null;
  note: string | null;
  citations: Citation[];
};

export type EventDetail = {
  id: string;
  eventType: string;
  occurredOn: string | null;
  precision: "day" | "unknown";
  title: string;
  summary: string;
  placesOnSurface: boolean;
  mission: { id: string; name: string };
  hardware: { id: string; name: string } | null;
  citations: Citation[];
};

export type HardwareDetail = HardwareListItem & {
  body: { id: string; name: string };
  nssdcaId: string | null;
  summaryCitations: Citation[];
  locations: LocationDetail[];
  facts: Array<{ id: string; label: string; value: string; citations: Citation[] }>;
  events: EventDetail[];
  children: Array<{ id: string; name: string; typeName: string; pin: Pin | null }>;
};

export type MissionListItem = {
  id: string;
  name: string;
  summary: string;
  summaryCitations: Citation[];
  hardwareCount: number;
  pinnedCount: number;
};

export type MissionDetail = MissionListItem & {
  body: { id: string; name: string };
  hardware: HardwareListItem[];
};

export type ArchiveSnapshot = {
  body: { id: string; name: string };
  missions: MissionListItem[];
  types: Array<{ id: string; name: string }>;
  hardware: HardwareListItem[];
  timeline: EventDetail[];
};

export type HardwareQuery = {
  mission?: string;
  type?: string;
  q?: string;
};
