/** Worlds the seed inserts and the map can switch to. */
export const ARCHIVE_BODIES = [
  { id: "moon", name: "Moon" },
  { id: "mars", name: "Mars" },
] as const;

export type ArchiveBodyId = (typeof ARCHIVE_BODIES)[number]["id"];

export const DEFAULT_BODY_ID: ArchiveBodyId = "moon";
