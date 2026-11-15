import type { EventInput, HardwareInput, LocationInput, MissionInput, SourceInput } from "@/types/seed";

/**
 * Longitude in this archive is positive east and stays within ±180°.
 * NASA often publishes Mars east longitude from 0° to 360°. Those values are
 * folded here, and the note keeps the number NASA printed.
 */
function signedEast(eastLongitudeDeg: number): number {
  let longitude = eastLongitudeDeg;
  while (longitude > 180) longitude -= 360;
  while (longitude < -180) longitude += 360;
  return Math.round(longitude * 1e6) / 1e6;
}

function marsLocation(input: {
  latitudeDeg: number;
  eastLongitudeDeg: number;
  sourceIds: string[];
  referenceFrame: string;
  regionName?: string;
  note?: string;
  isPreferred?: boolean;
  specificity?: LocationInput["specificity"];
}): LocationInput {
  const longitudeDeg = signedEast(input.eastLongitudeDeg);
  const wrap =
    longitudeDeg === input.eastLongitudeDeg
      ? undefined
      : `NASA published ${input.eastLongitudeDeg}° east longitude. The archive stores ${longitudeDeg}° so longitude stays within ±180°.`;
  const note = [input.note, wrap].filter(Boolean).join(" ");
  return {
    latitudeDeg: input.latitudeDeg,
    longitudeDeg,
    referenceFrame: input.referenceFrame,
    method: "mission_report",
    specificity: input.specificity ?? "object",
    isPreferred: input.isPreferred !== false,
    regionName: input.regionName,
    note: note.length > 0 ? note : undefined,
    sourceIds: input.sourceIds,
  };
}

function dayEvent(input: {
  id: string;
  eventType: EventInput["eventType"];
  occurredOn: string;
  title: string;
  summary: string;
  sourceIds: string[];
  placesOnSurface?: boolean;
}): EventInput {
  return {
    id: input.id,
    eventType: input.eventType,
    occurredOn: input.occurredOn,
    precision: "day",
    title: input.title,
    summary: input.summary,
    placesOnSurface: input.placesOnSurface ?? false,
    sourceIds: input.sourceIds,
  };
}

export const sources: SourceInput[] = [
  {
    id: "nssdca-viking",
    title: "Viking Project Information",
    url: "https://nssdc.gsfc.nasa.gov/planetary/viking.html",
    publisher: "NASA NSSDCA",
  },
  {
    id: "science-viking",
    title: "Viking Project",
    url: "https://science.nasa.gov/mission/viking/",
    publisher: "NASA Science",
  },
  {
    id: "nssdca-pathfinder",
    title: "Mars Pathfinder Project Information",
    url: "https://nssdc.gsfc.nasa.gov/planetary/mesur.html",
    publisher: "NASA NSSDCA",
  },
  {
    id: "science-pathfinder-ellipses",
    title: "Mars Pathfinder Landing Ellipses",
    url: "https://science.nasa.gov/photojournal/mars-pathfinder-landing-ellipses/",
    publisher: "NASA Science",
  },
  {
    id: "science-pathfinder-site",
    title: "Mars Pathfinder Landing Site",
    url: "https://science.nasa.gov/resource/mars-pathfinder-landing-site/",
    publisher: "NASA Science",
  },
  {
    id: "pds-sojourner",
    title: "Mars Pathfinder Rover Camera EDR Dataset Description",
    url: "https://pds-imaging.jpl.nasa.gov/data/mpfr-m-rvrcam-2-edr-v1.0/mprv_0001/document/rvcedrds.htm",
    publisher: "NASA PDS",
  },
  {
    id: "science-spirit",
    title: "Spirit",
    url: "https://science.nasa.gov/mission/mer-spirit/",
    publisher: "NASA Science",
  },
  {
    id: "jpl-spirit-troy",
    title: "Orbital View of Spirit at Troy",
    url: "https://www.jpl.nasa.gov/images/pia12205-orbital-view-of-spirit-at-troy/",
    publisher: "NASA JPL",
  },
  {
    id: "science-opportunity",
    title: "Opportunity",
    url: "https://science.nasa.gov/mission/mer-opportunity/",
    publisher: "NASA Science",
  },
  {
    id: "science-opportunity-lander",
    title: "Rover's Landing Hardware at Eagle Crater, Mars",
    url: "https://science.nasa.gov/resource/rovers-landing-hardware-at-eagle-crater-mars-annotated/",
    publisher: "NASA Science",
  },
  {
    id: "jpl-opportunity-end",
    title: "Opportunity's Parting Shot Was a Beautiful Panorama",
    url: "https://www.jpl.nasa.gov/news/opportunitys-parting-shot-was-a-beautiful-panorama/",
    publisher: "NASA JPL",
  },
  {
    id: "science-phoenix",
    title: "Mars Phoenix",
    url: "https://science.nasa.gov/mission/mars-phoenix/",
    publisher: "NASA Science",
  },
  {
    id: "science-insight",
    title: "InSight Lander",
    url: "https://science.nasa.gov/mission/insight/",
    publisher: "NASA Science",
  },
  {
    id: "naif-insight",
    title: "InSight Frames Kernel insight_v05.tf",
    url: "https://naif.jpl.nasa.gov/pub/naif/INSIGHT/kernels/fk/insight_v05.tf",
    publisher: "NASA NAIF / JPL",
  },
  {
    id: "science-ingenuity",
    title: "Ingenuity Mars Helicopter",
    url: "https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/",
    publisher: "NASA Science",
  },
  {
    id: "science-ingenuity-valinor",
    title: "Ingenuity at Valinor Hills",
    url: "https://science.nasa.gov/resource/ingenuity-at-valinor-hills/",
    publisher: "NASA Science",
  },
];

const viking = ["nssdca-viking", "science-viking"];
const pathfinder = ["nssdca-pathfinder", "science-pathfinder-ellipses"];
const spirit = ["science-spirit"];
const opportunity = ["science-opportunity"];
const phoenix = ["science-phoenix"];
const insight = ["science-insight", "naif-insight"];
const ingenuity = ["science-ingenuity", "science-ingenuity-valinor"];

export const missions: MissionInput[] = [
  {
    id: "viking-1",
    celestialBodyId: "mars",
    name: "Viking 1",
    summary:
      "Viking 1 launched on 20 August 1975. Its lander touched down on Chryse Planitia on 20 July 1976 and remains there.",
    summarySourceIds: viking,
    events: [
      dayEvent({
        id: "viking-1-launch",
        eventType: "launch",
        occurredOn: "1975-08-20",
        title: "Viking 1 launched",
        summary: "NSSDCA lists the Viking 1 launch date as 20 August 1975.",
        sourceIds: ["nssdca-viking"],
      }),
    ],
  },
  {
    id: "viking-2",
    celestialBodyId: "mars",
    name: "Viking 2",
    summary:
      "Viking 2 launched on 9 September 1975. Its lander touched down on Utopia Planitia on 3 September 1976 and remains there.",
    summarySourceIds: viking,
    events: [
      dayEvent({
        id: "viking-2-launch",
        eventType: "launch",
        occurredOn: "1975-09-09",
        title: "Viking 2 launched",
        summary: "NSSDCA lists the Viking 2 launch date as 9 September 1975.",
        sourceIds: ["nssdca-viking"],
      }),
    ],
  },
  {
    id: "mars-pathfinder",
    celestialBodyId: "mars",
    name: "Mars Pathfinder",
    summary:
      "Mars Pathfinder landed in Ares Vallis on 4 July 1997 and let Sojourner roll onto the surface two days later. The lander was named the Carl Sagan Memorial Station. Both remain at the site.",
    summarySourceIds: pathfinder,
    events: [
      dayEvent({
        id: "mars-pathfinder-end",
        eventType: "shutdown",
        occurredOn: "1998-03-10",
        title: "Mission terminated",
        summary:
          "NASA Science says the last Pathfinder transmission was 27 September 1997, and the mission was terminated on 10 March 1998.",
        sourceIds: ["science-pathfinder-ellipses"],
      }),
    ],
  },
  {
    id: "spirit",
    celestialBodyId: "mars",
    name: "Spirit",
    summary:
      "Spirit landed in Gusev crater on 3 January 2004. The landing platform stayed at Columbia Memorial Station. The rover drove on and remains at Troy, beside Home Plate.",
    summarySourceIds: spirit,
    events: [
      dayEvent({
        id: "spirit-launch",
        eventType: "launch",
        occurredOn: "2003-06-10",
        title: "Spirit launched",
        summary: "NASA Science lists the Spirit launch date as 10 June 2003.",
        sourceIds: spirit,
      }),
    ],
  },
  {
    id: "opportunity",
    celestialBodyId: "mars",
    name: "Opportunity",
    summary:
      "Opportunity landed in Eagle crater on 25 January 2004. The landing platform stayed there. The rover drove on and went silent in Perseverance Valley, on the rim of Endeavour crater.",
    summarySourceIds: opportunity,
    events: [
      dayEvent({
        id: "opportunity-launch",
        eventType: "launch",
        occurredOn: "2003-07-07",
        title: "Opportunity launched",
        summary: "NASA Science lists the Opportunity launch as 20:18:15 PDT on 7 July 2003.",
        sourceIds: opportunity,
      }),
    ],
  },
  {
    id: "phoenix",
    celestialBodyId: "mars",
    name: "Phoenix",
    summary:
      "Phoenix landed in the Green Valley of Vastitas Borealis on 25 May 2008. It remains at that spot.",
    summarySourceIds: phoenix,
    events: [
      dayEvent({
        id: "phoenix-launch",
        eventType: "launch",
        occurredOn: "2007-08-04",
        title: "Phoenix launched",
        summary: "NASA Science lists the Phoenix launch as 4 August 2007 UTC.",
        sourceIds: phoenix,
      }),
    ],
  },
  {
    id: "insight",
    celestialBodyId: "mars",
    name: "InSight",
    summary:
      "InSight landed on Elysium Planitia on 26 November 2018. Its arm placed a seismometer and a heat-flow probe on the surface. The lander remains where it touched down.",
    summarySourceIds: insight,
    events: [
      dayEvent({
        id: "insight-launch",
        eventType: "launch",
        occurredOn: "2018-05-05",
        title: "InSight launched",
        summary: "NASA Science lists the InSight launch as 5 May 2018.",
        sourceIds: ["science-insight"],
      }),
    ],
  },
  {
    id: "mars-2020",
    celestialBodyId: "mars",
    name: "Mars 2020",
    summary:
      "Mars 2020 landed in Jezero crater on 18 February 2021 carrying the Ingenuity helicopter. Perseverance is still operating, so the rover is not catalogued. Ingenuity is the hardware left behind, at the place NASA calls Valinor Hills.",
    summarySourceIds: ingenuity,
  },
];

const published = "Latitude and east longitude, as published";

export const hardware: HardwareInput[] = [
  {
    id: "viking-1-lander",
    missionId: "viking-1",
    typeId: "lander",
    name: "Viking 1 lander",
    restingState: "on_surface",
    condition: "inactive",
    summary:
      "The Viking 1 lander touched down on Chryse Planitia on 20 July 1976 and is still there. NSSDCA gives the site as 22.27° N, 312.05° E, planetocentric.",
    summarySourceIds: viking,
    locations: [
      marsLocation({
        latitudeDeg: 22.27,
        eastLongitudeDeg: 312.05,
        referenceFrame: "Planetocentric, as published by NSSDCA",
        regionName: "Chryse Planitia",
        sourceIds: viking,
      }),
    ],
    events: [
      dayEvent({
        id: "viking-1-lander-landing",
        eventType: "landing",
        occurredOn: "1976-07-20",
        title: "Landed on Chryse Planitia",
        summary: "NSSDCA says the Viking 1 lander touched down at Chryse Planitia on 20 July 1976.",
        placesOnSurface: true,
        sourceIds: viking,
      }),
      dayEvent({
        id: "viking-1-lander-last-contact",
        eventType: "last_contact",
        occurredOn: "1982-11-11",
        title: "Final transmission",
        summary: "NASA Science says Viking Lander 1 made its final transmission on 11 November 1982.",
        sourceIds: ["science-viking"],
      }),
      dayEvent({
        id: "viking-1-lander-end",
        eventType: "shutdown",
        occurredOn: "1982-11-13",
        title: "Lander operations ended",
        summary:
          "NSSDCA and the NASA Science quick facts date the end of Viking Lander 1 as 13 November 1982.",
        sourceIds: viking,
      }),
    ],
  },
  {
    id: "viking-2-lander",
    missionId: "viking-2",
    typeId: "lander",
    name: "Viking 2 lander",
    restingState: "on_surface",
    condition: "inactive",
    summary:
      "The Viking 2 lander touched down on Utopia Planitia on 3 September 1976 and is still there. NSSDCA gives the site as 47.64° N, 134.29° E, planetocentric.",
    summarySourceIds: viking,
    locations: [
      marsLocation({
        latitudeDeg: 47.64,
        eastLongitudeDeg: 134.29,
        referenceFrame: "Planetocentric, as published by NSSDCA",
        regionName: "Utopia Planitia",
        sourceIds: viking,
      }),
    ],
    events: [
      dayEvent({
        id: "viking-2-lander-landing",
        eventType: "landing",
        occurredOn: "1976-09-03",
        title: "Landed on Utopia Planitia",
        summary: "NSSDCA says the Viking 2 lander touched down at Utopia Planitia on 3 September 1976.",
        placesOnSurface: true,
        sourceIds: viking,
      }),
      dayEvent({
        id: "viking-2-lander-last-contact",
        eventType: "last_contact",
        occurredOn: "1980-04-11",
        title: "Communications ended",
        summary: "NSSDCA says the Viking 2 lander ended communications on 11 April 1980.",
        sourceIds: viking,
      }),
    ],
  },
  {
    id: "pathfinder-lander",
    missionId: "mars-pathfinder",
    typeId: "lander",
    name: "Mars Pathfinder",
    restingState: "on_surface",
    condition: "inactive",
    summary:
      "The Mars Pathfinder lander, named the Carl Sagan Memorial Station, bounced to a stop in Ares Vallis on 4 July 1997 and remains there. NSSDCA publishes 19.33° N, 33.55° W. NASA Science also publishes a USGS-network figure.",
    summarySourceIds: [...pathfinder, "science-pathfinder-site"],
    locations: [
      marsLocation({
        latitudeDeg: 19.33,
        eastLongitudeDeg: -33.55,
        referenceFrame: "Local reference frame published by NSSDCA",
        regionName: "Ares Vallis",
        note: "Published as 19.33° N, 33.55° W. The map uses this NSSDCA figure.",
        sourceIds: ["nssdca-pathfinder", "science-pathfinder-ellipses"],
      }),
      marsLocation({
        latitudeDeg: 19.17,
        eastLongitudeDeg: -33.21,
        referenceFrame: "USGS cartographic network",
        regionName: "Ares Vallis",
        note: "NASA Science places the lander at 19.17° N, 33.21° W in the USGS cartographic network. The map uses the NSSDCA coordinate.",
        isPreferred: false,
        sourceIds: ["science-pathfinder-site"],
      }),
    ],
    events: [
      dayEvent({
        id: "pathfinder-lander-landing",
        eventType: "landing",
        occurredOn: "1997-07-04",
        title: "Landed in Ares Vallis",
        summary:
          "NSSDCA says Mars Pathfinder reached the surface at 16:57 UT on 4 July 1997 and came to rest about 2.5 minutes later.",
        placesOnSurface: true,
        sourceIds: ["nssdca-pathfinder"],
      }),
      dayEvent({
        id: "pathfinder-lander-last-contact",
        eventType: "last_contact",
        occurredOn: "1997-09-27",
        title: "Final transmission",
        summary:
          "NASA Science says the final data transmission from Pathfinder was at 10:23 UTC on 27 September 1997.",
        sourceIds: ["science-pathfinder-ellipses"],
      }),
    ],
  },
  {
    id: "sojourner",
    missionId: "mars-pathfinder",
    parentId: "pathfinder-lander",
    typeId: "rover",
    name: "Sojourner",
    restingState: "on_surface",
    condition: "inactive",
    summary:
      "Sojourner, the first rover on Mars, rolled off Pathfinder on 6 July 1997. NASA’s PDS says it stayed within a 12 meter radius of the lander. No separate coordinate is published, so the map uses the lander’s pin.",
    summarySourceIds: ["nssdca-pathfinder", "pds-sojourner"],
    locations: [
      {
        method: "unknown",
        specificity: "site",
        isPreferred: true,
        regionName: "Ares Vallis",
        note: "No separate coordinate is published. The PDS says Sojourner stayed within a 12 meter radius of the lander, so the map uses that pin.",
        sourceIds: ["pds-sojourner", "nssdca-pathfinder"],
      },
    ],
    facts: [
      {
        id: "sojourner-range",
        label: "Range from the lander",
        value: "Stayed within a 12 meter radius during its 83-sol mission.",
        sourceIds: ["pds-sojourner"],
      },
    ],
    events: [
      dayEvent({
        id: "sojourner-deployment",
        eventType: "deployment",
        occurredOn: "1997-07-06",
        title: "Rolled onto the surface",
        summary: "NSSDCA says Sojourner rolled onto Mars at about 05:40 UT on 6 July 1997.",
        placesOnSurface: true,
        sourceIds: ["nssdca-pathfinder"],
      }),
    ],
  },
  {
    id: "spirit-lander",
    missionId: "spirit",
    typeId: "lander",
    name: "Spirit landing platform",
    restingState: "on_surface",
    condition: "inactive",
    summary:
      "The airbag lander that delivered Spirit stayed at Columbia Memorial Station in Gusev crater. NASA Science publishes the landing coordinate as 14.5692° S, 175.4729° E. Spirit later drove away.",
    summarySourceIds: spirit,
    locations: [
      marsLocation({
        latitudeDeg: -14.5692,
        eastLongitudeDeg: 175.4729,
        referenceFrame: published,
        regionName: "Columbia Memorial Station, Gusev crater",
        sourceIds: spirit,
      }),
    ],
    events: [
      dayEvent({
        id: "spirit-lander-landing",
        eventType: "landing",
        occurredOn: "2004-01-03",
        title: "Landed in Gusev crater",
        summary:
          "NASA Science lists the landing as 3 January 2004 and says the rover package hit the surface at 20:35 PST that day.",
        placesOnSurface: true,
        sourceIds: spirit,
      }),
    ],
  },
  {
    id: "spirit-rover",
    missionId: "spirit",
    typeId: "rover",
    name: "Spirit",
    restingState: "on_surface",
    condition: "inactive",
    summary:
      "Spirit remains at Troy, just west of Home Plate in Gusev crater. JPL publishes that spot as 14.6° S, 175.5° E. The rover landed at a different coordinate on 3 January 2004, drove 7.73 kilometers, and became stuck on 1 May 2009.",
    summarySourceIds: [...spirit, "jpl-spirit-troy"],
    locations: [
      marsLocation({
        latitudeDeg: -14.6,
        eastLongitudeDeg: 175.5,
        referenceFrame: published,
        regionName: "Troy, beside Home Plate, Gusev crater",
        note: "JPL gives the Troy site, where Spirit was already embedded, to the nearest tenth of a degree. This is the final spot, not the landing coordinate.",
        sourceIds: ["jpl-spirit-troy"],
      }),
    ],
    facts: [
      {
        id: "spirit-distance",
        label: "Distance driven",
        value: "4.8 miles (7.73 kilometers).",
        sourceIds: spirit,
      },
    ],
    events: [
      dayEvent({
        id: "spirit-rover-landing",
        eventType: "landing",
        occurredOn: "2004-01-03",
        title: "Landed in Gusev crater",
        summary:
          "NASA Science lists Spirit’s landing as 3 January 2004 and says it became stuck at Troy on 1 May 2009. The map pin is that final spot, not the landing site.",
        placesOnSurface: true,
        sourceIds: spirit,
      }),
      dayEvent({
        id: "spirit-rover-last-contact",
        eventType: "last_contact",
        occurredOn: "2010-03-22",
        title: "Last contact",
        summary: "NASA Science says controllers could not regain contact with Spirit after 22 March 2010.",
        sourceIds: spirit,
      }),
      dayEvent({
        id: "spirit-rover-end",
        eventType: "shutdown",
        occurredOn: "2011-05-25",
        title: "Recovery ended",
        summary: "NASA Science says recovery efforts ended on 25 May 2011.",
        sourceIds: spirit,
      }),
    ],
  },
  {
    id: "opportunity-lander",
    missionId: "opportunity",
    typeId: "lander",
    name: "Opportunity landing platform",
    restingState: "on_surface",
    condition: "inactive",
    summary:
      "The airbag lander that delivered Opportunity stayed in Eagle crater. NASA Science publishes the landing coordinate as 1.9483° S, 354.47417° E, and a later HiRISE image shows the platform still there. Opportunity drove away.",
    summarySourceIds: [...opportunity, "science-opportunity-lander"],
    locations: [
      marsLocation({
        latitudeDeg: -1.9483,
        eastLongitudeDeg: 354.47417,
        referenceFrame: published,
        regionName: "Eagle crater, Meridiani Planum",
        sourceIds: [...opportunity, "science-opportunity-lander"],
      }),
    ],
    events: [
      dayEvent({
        id: "opportunity-lander-landing",
        eventType: "landing",
        occurredOn: "2004-01-25",
        title: "Landed in Eagle crater",
        summary:
          "NASA Science says Opportunity’s lander came to rest on 25 January 2004 at 1.9483° S, 354.47417° E.",
        placesOnSurface: true,
        sourceIds: opportunity,
      }),
    ],
  },
  {
    id: "opportunity-rover",
    missionId: "opportunity",
    typeId: "rover",
    name: "Opportunity",
    restingState: "on_surface",
    condition: "inactive",
    summary:
      "Opportunity went silent in Perseverance Valley, on the inner slope of the western rim of Endeavour crater. NASA names that valley as the final resting place and does not publish a latitude and longitude for it. The Eagle crater coordinate belongs to the landing platform, about a 45 kilometer drive away, so this rover has no map pin.",
    summarySourceIds: [...opportunity, "jpl-opportunity-end"],
    locations: [
      {
        method: "unknown",
        specificity: "unknown",
        isPreferred: true,
        regionName: "Perseverance Valley, Endeavour crater",
        note: "NASA names Perseverance Valley as the final resting place and does not publish a coordinate. The landing coordinate is a different object, the platform in Eagle crater.",
        sourceIds: [...opportunity, "jpl-opportunity-end"],
      },
    ],
    facts: [
      {
        id: "opportunity-distance",
        label: "Distance driven",
        value: "28.06 miles (45.16 kilometers) when the mission was declared complete.",
        sourceIds: opportunity,
      },
    ],
    events: [
      dayEvent({
        id: "opportunity-rover-landing",
        eventType: "landing",
        occurredOn: "2004-01-25",
        title: "Landed in Eagle crater",
        summary: "NASA Science says Opportunity landed on 25 January 2004. It later drove out of Eagle crater.",
        placesOnSurface: true,
        sourceIds: opportunity,
      }),
      dayEvent({
        id: "opportunity-rover-last-contact",
        eventType: "last_contact",
        occurredOn: "2018-06-10",
        title: "Last signal",
        summary:
          "NASA Science says the last signal from Opportunity was 10 June 2018, during a planet-wide dust storm, from Perseverance Valley.",
        sourceIds: opportunity,
      }),
      dayEvent({
        id: "opportunity-rover-end",
        eventType: "shutdown",
        occurredOn: "2019-02-13",
        title: "Mission declared complete",
        summary: "NASA Science says the mission was declared complete on 13 February 2019.",
        sourceIds: opportunity,
      }),
    ],
  },
  {
    id: "phoenix-lander",
    missionId: "phoenix",
    typeId: "lander",
    name: "Phoenix",
    restingState: "on_surface",
    condition: "inactive",
    summary:
      "Phoenix touched down in the Green Valley of Vastitas Borealis on 25 May 2008 and remains there. NASA Science publishes the site as 68.22° N, 234.25° E.",
    summarySourceIds: phoenix,
    locations: [
      marsLocation({
        latitudeDeg: 68.22,
        eastLongitudeDeg: 234.25,
        referenceFrame: published,
        regionName: "Green Valley, Vastitas Borealis",
        sourceIds: phoenix,
      }),
    ],
    events: [
      dayEvent({
        id: "phoenix-lander-landing",
        eventType: "landing",
        occurredOn: "2008-05-25",
        title: "Landed in Green Valley",
        summary: "NASA Science says Phoenix touched down at 23:38:38 UT on 25 May 2008.",
        placesOnSurface: true,
        sourceIds: phoenix,
      }),
      dayEvent({
        id: "phoenix-lander-last-contact",
        eventType: "last_contact",
        occurredOn: "2008-11-02",
        title: "End of mission",
        summary: "NASA Science dates the end of the Phoenix mission as 2 November 2008.",
        sourceIds: phoenix,
      }),
    ],
  },
  {
    id: "insight-lander",
    missionId: "insight",
    typeId: "lander",
    name: "InSight",
    restingState: "on_surface",
    condition: "inactive",
    summary:
      "InSight landed on Elysium Planitia on 26 November 2018 and remains there. The NAIF/JPL frame kernel, tied to a HiRISE image from 6 December 2018, gives the lander as 4.502384° N, 135.623447° E areocentric. NASA Science describes the targeted region separately, near 4.5° N, 135.9° E.",
    summarySourceIds: insight,
    locations: [
      marsLocation({
        latitudeDeg: 4.502384,
        eastLongitudeDeg: 135.623447,
        referenceFrame: "Areocentric latitude and east longitude, IAU Mars, NAIF frame kernel",
        regionName: "Elysium Planitia",
        note: "Surveyed lander position from the HiRISE image of 6 December 2018, as written in the NAIF kernel. The map uses this coordinate.",
        sourceIds: ["naif-insight"],
      }),
      marsLocation({
        latitudeDeg: 4.5,
        eastLongitudeDeg: 135.9,
        referenceFrame: published,
        regionName: "Elysium Planitia",
        specificity: "site",
        isPreferred: false,
        note: "NASA Science says the landing region is centered at about 4.5° N, 135.9° E. That is the targeted area, not the surveyed lander.",
        sourceIds: ["science-insight"],
      }),
    ],
    events: [
      dayEvent({
        id: "insight-lander-landing",
        eventType: "landing",
        occurredOn: "2018-11-26",
        title: "Landed on Elysium Planitia",
        summary: "NASA Science says InSight landed at 11:52:59 a.m. PT on 26 November 2018.",
        placesOnSurface: true,
        sourceIds: ["science-insight"],
      }),
      dayEvent({
        id: "insight-lander-last-contact",
        eventType: "last_contact",
        occurredOn: "2022-12-15",
        title: "Last contact",
        summary: "NASA Science dates the end of the mission as 15 December 2022, the last day InSight was contacted.",
        sourceIds: ["science-insight"],
      }),
    ],
  },
  {
    id: "ingenuity",
    missionId: "mars-2020",
    typeId: "helicopter",
    name: "Ingenuity",
    restingState: "on_surface",
    condition: "inactive",
    summary:
      "Ingenuity, the first aircraft on another planet, flew 72 times and damaged its rotor blades on the landing of its last flight, 18 January 2024. NASA calls the final spot Valinor Hills in Jezero crater and does not publish a latitude and longitude for it, so this record has no map pin.",
    summarySourceIds: ingenuity,
    locations: [
      {
        method: "unknown",
        specificity: "unknown",
        isPreferred: true,
        regionName: "Valinor Hills, Jezero crater",
        note: "NASA names Valinor Hills as the final airfield and does not publish a coordinate. The Mars 2020 landing area is not this helicopter’s final spot.",
        sourceIds: ingenuity,
      },
    ],
    facts: [
      {
        id: "ingenuity-flights",
        label: "Flights",
        value: "72 flights. The first was 19 April 2021 and the last was 18 January 2024.",
        sourceIds: ["science-ingenuity"],
      },
    ],
    events: [
      dayEvent({
        id: "ingenuity-landing",
        eventType: "landing",
        occurredOn: "2021-02-18",
        title: "Landed with Perseverance",
        summary:
          "NASA Science says Ingenuity landed in Jezero crater on 18 February 2021, strapped beneath Perseverance.",
        placesOnSurface: true,
        sourceIds: ["science-ingenuity"],
      }),
      dayEvent({
        id: "ingenuity-first-flight",
        eventType: "deployment",
        occurredOn: "2021-04-19",
        title: "First powered flight",
        summary: "NASA Science says Ingenuity’s first flight was 19 April 2021, the first powered flight on another planet.",
        sourceIds: ["science-ingenuity"],
      }),
      dayEvent({
        id: "ingenuity-last-flight",
        eventType: "last_contact",
        occurredOn: "2024-01-18",
        title: "Last flight",
        summary:
          "NASA Science says Ingenuity flew for the last time on 18 January 2024 and damaged its rotor blades on landing.",
        sourceIds: ingenuity,
      }),
      dayEvent({
        id: "ingenuity-end",
        eventType: "shutdown",
        occurredOn: "2024-01-25",
        title: "Mission completed",
        summary: "NASA Science says the Ingenuity mission was completed on 25 January 2024.",
        sourceIds: ["science-ingenuity"],
      }),
    ],
  },
];

export const hardwareTypes = [{ id: "helicopter", name: "Helicopter" }];
