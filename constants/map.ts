/**
 * Pins closer than this on screen share one marker.
 * 40px is Supercluster's default radius: markers merge when they would overlap,
 * and separate again when the map is large enough to tell them apart.
 */
export const CLUSTER_RADIUS_PX = 40;

/**
 * Earlier types name a shared site, so a lander wins over a small instrument.
 */
export const CLUSTER_LABEL_RANK = [
  "descent-stage",
  "lander",
  "rover",
  "station",
  "impact-stage",
  "impactor",
] as const;

/** Bounds used only when the loaded archive has no dated events. */
export const TIMELINE_ORIGIN = "1964-02-02";
export const TIMELINE_LATEST = "2014-04-18";

/** Delay between years while the archive is playing forward. */
export const TIMELINE_TICK_MS = 480;

/**
 * Marker groups for the map legend.
 * Impact covers crashed orbiters, Rangers, and spent rocket stages.
 * Those are not all orbiters, so the legend does not call them that.
 */
export const MARKER_KINDS = [
  {
    id: "lander",
    label: "Lander",
    types: ["descent-stage", "lander"],
  },
  {
    id: "rover",
    label: "Rover",
    types: ["rover", "helicopter"],
  },
  {
    id: "impact",
    label: "Impact",
    types: ["ascent-stage", "impact-stage", "impactor"],
  },
  {
    id: "experiment",
    label: "Experiment",
    types: ["station", "instrument", "retroreflector", "power-source"],
  },
] as const;

export type MarkerKindId = (typeof MARKER_KINDS)[number]["id"];

/** Longer prefixes first so Lunar Orbiter does not collapse into a shorter name. */
const PROGRAM_PREFIXES: Array<{ id: string; label: string }> = [
  { id: "lunar-orbiter", label: "Lunar Orbiter" },
  { id: "lunar-prospector", label: "Lunar Prospector" },
  { id: "mars-pathfinder", label: "Mars Pathfinder" },
  { id: "surveyor", label: "Surveyor" },
  { id: "ranger", label: "Ranger" },
  { id: "apollo", label: "Apollo" },
  { id: "explorer", label: "Explorer" },
  { id: "viking", label: "Viking" },
  { id: "lcross", label: "LCROSS" },
  { id: "grail", label: "GRAIL" },
  { id: "ladee", label: "LADEE" },
];

export type Basemap = {
  src: string;
  title: string;
  href: string;
};

/**
 * Browse images in public/maps. Only worlds with a simple-cylindrical JPEG
 * are listed. Both have 0° longitude at the center, so the same pin frame fits.
 * The Mars file is the HRSC high-altitude colour browse image, 1280×640.
 */
export const BASEMAPS: Partial<Record<string, Basemap>> = {
  moon: {
    src: "/maps/moon.jpg",
    title: "LROC color mosaic, NASA Scientific Visualization Studio",
    href: "https://svs.gsfc.nasa.gov/4720/",
  },
  mars: {
    src: "/maps/mars.jpg",
    title: "HRSC colour mosaic, ESA/DLR/FU Berlin",
    href: "https://hrscteam.dlr.de/public/data/globalcolor.php",
  },
};

export function markerKind(typeId: string): MarkerKindId | null {
  const found = MARKER_KINDS.find((kind) => (kind.types as readonly string[]).includes(typeId));
  return found?.id ?? null;
}

/** Groups a mission with its program. An unmatched id keeps its own checkbox. */
export function programFor(missionId: string, missionName: string): { id: string; label: string } {
  const match = PROGRAM_PREFIXES.find((prefix) => missionId === prefix.id || missionId.startsWith(`${prefix.id}-`));
  return match ?? { id: missionId, label: missionName };
}
