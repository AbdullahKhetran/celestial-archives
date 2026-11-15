/** Hardware within this distance shares one marker. NSSDCA treats 0.001° as about 30 m on the Moon. */
export const CLUSTER_METERS = 2000;

/**
 * Degrees-to-meters scale used only to cluster pins.
 * Moon follows the NSSDCA figure. Mars uses about 59 km per degree of latitude,
 * so a landing platform and a rover that drove away do not share a marker.
 */
export const METERS_PER_DEGREE: Record<string, number> = {
  moon: 30_000,
  mars: 59_000,
};

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
