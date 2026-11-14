"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { CLUSTER_LABEL_RANK, CLUSTER_METERS, TIMELINE_LATEST, TIMELINE_ORIGIN, TIMELINE_TICK_MS } from "@/constants/map";
import { filterHardware } from "@/app/lib/archive/filter";
import { approximateMeters, formatCoordinate, formatDay, yearEnd, yearStart, yearsFrom } from "@/app/lib/archive/geo";
import type { ArchiveSnapshot, HardwareListItem } from "@/types/archive";
import { YearRail } from "@/app/components/year-rail";

type Cluster = {
  id: string;
  latitudeDeg: number;
  longitudeDeg: number;
  items: HardwareListItem[];
};

type ArchiveExplorerProps = {
  archive: ArchiveSnapshot;
  initialMission?: string;
  initialType?: string;
};

type PinPosition = Pick<CSSProperties, "left" | "top">;

/**
 * Groups hardware that sits within CLUSTER_METERS so a landing site is one marker.
 * The marker is placed at the mean of its members.
 */
function clusterHardware(items: HardwareListItem[]): Cluster[] {
  const clusters: Cluster[] = [];
  for (const item of items) {
    if (!item.pin) continue;
    const match = clusters.find(
      (cluster) => approximateMeters(cluster, item.pin!) < CLUSTER_METERS,
    );
    if (match) {
      match.items.push(item);
    } else {
      clusters.push({
        id: item.id,
        latitudeDeg: item.pin.latitudeDeg,
        longitudeDeg: item.pin.longitudeDeg,
        items: [item],
      });
    }
  }

  return clusters.map((cluster) => {
    const latitudeDeg =
      cluster.items.reduce((sum, item) => sum + item.pin!.latitudeDeg, 0) / cluster.items.length;
    const longitudeDeg =
      cluster.items.reduce((sum, item) => sum + item.pin!.longitudeDeg, 0) / cluster.items.length;
    return {
      ...cluster,
      latitudeDeg,
      longitudeDeg,
      id: cluster.items
        .map((item) => item.id)
        .sort()
        .join("|"),
    };
  });
}

function clusterLabel(cluster: Cluster): string {
  const rankOf = (id: string) => {
    const index = CLUSTER_LABEL_RANK.indexOf(id as (typeof CLUSTER_LABEL_RANK)[number]);
    return index === -1 ? CLUSTER_LABEL_RANK.length : index;
  };
  const lead = [...cluster.items].sort((a, b) => rankOf(a.type.id) - rankOf(b.type.id))[0];
  return cluster.items.length > 1 ? `${lead.mission.name} site` : lead.name;
}

function pinKind(cluster: Cluster): "impact" | "site" | "object" {
  if (cluster.items.every((item) => item.restingState === "impacted")) return "impact";
  if (cluster.items.every((item) => item.pin?.specificity === "site")) return "site";
  return "object";
}

/** Equirectangular placement. Percentages stay inline because each pin has its own coordinate. */
function project(latitudeDeg: number, longitudeDeg: number): PinPosition {
  return {
    left: `${((longitudeDeg + 180) / 360) * 100}%`,
    top: `${((90 - latitudeDeg) / 180) * 100}%`,
  };
}

/** Spreads object pins across the site inset. Positions are computed from the local coordinate span. */
function insetStyle(item: HardwareListItem, objectPins: HardwareListItem[]): PinPosition {
  const pins = objectPins.flatMap((entry) => (entry.pin ? [entry.pin] : []));
  const latitudes = pins.map((pin) => pin.latitudeDeg);
  const longitudes = pins.map((pin) => pin.longitudeDeg);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const latSpan = Math.max(maxLat - minLat, 0.01);
  const lonSpan = Math.max(maxLon - minLon, 0.01);
  const pin = item.pin!;
  return {
    left: `${((pin.longitudeDeg - (minLon - lonSpan * 0.35)) / (lonSpan * 1.7)) * 100}%`,
    top: `${((maxLat + latSpan * 0.35 - pin.latitudeDeg) / (latSpan * 1.7)) * 100}%`,
  };
}

function during(start: number, end: number): string {
  return start === end ? `in ${start}` : `from ${start} through ${end}`;
}

/** Sentence under the rail. A single year keeps the old wording; a span counts the window. */
function arrivalCaption(start: number, end: number, count: number): string {
  if (start === end) {
    const arrival =
      count === 0 ? "Nothing new arrives this year." : count === 1 ? "1 record arrives this year." : `${count} records arrive this year.`;
    return `Through ${start}. ${arrival}`;
  }
  const arrival =
    count === 0 ? "Nothing arrives in this span." : count === 1 ? "1 record arrives in this span." : `${count} records arrive in this span.`;
  return `From ${start} through ${end}. ${arrival}`;
}

/** Inclusive years that contain a dated arrival or event. Falls back when the archive has none. */
function archiveYears(archive: ArchiveSnapshot): number[] {
  const found: number[] = [];
  for (const item of archive.hardware) {
    if (item.arrivedOn) found.push(Number(item.arrivedOn.slice(0, 4)));
  }
  for (const event of archive.timeline) {
    if (event.occurredOn) found.push(Number(event.occurredOn.slice(0, 4)));
  }
  if (found.length === 0) return yearsFrom(TIMELINE_ORIGIN, TIMELINE_LATEST);
  return yearsFrom(String(Math.min(...found)), String(Math.max(...found)));
}

/**
 * Map, year span, and ledger for hardware left on the Moon.
 * Several instruments share a landing site, so nearby records share one marker.
 * The year control is a window: the map keeps records that arrived between the two handles.
 */
export default function ArchiveExplorer({ archive, initialMission, initialType }: ArchiveExplorerProps) {
  const years = useMemo(() => archiveYears(archive), [archive]);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(years.length - 1);
  const [playing, setPlaying] = useState(false);
  const [mission, setMission] = useState(initialMission ?? "");
  const [type, setType] = useState(initialType ?? "");
  const [query, setQuery] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [selectedHardware, setSelectedHardware] = useState<string | null>(null);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setEndIndex((current) => {
        if (current >= years.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, TIMELINE_TICK_MS);
    return () => window.clearInterval(timer);
  }, [playing, years.length]);

  const rawStart = years[startIndex] ?? years[0];
  const rawEnd = years[endIndex] ?? years[years.length - 1];
  const startYear = Math.min(rawStart, rawEnd);
  const endYear = Math.max(rawStart, rawEnd);
  const from = yearStart(startYear);
  const through = yearEnd(endYear);
  const filtered = useMemo(
    () => filterHardware(archive.hardware, { mission: mission || undefined, type: type || undefined, q: query || undefined }),
    [archive.hardware, mission, type, query],
  );
  const arrivalYears = useMemo(() => {
    const marked = new Set<number>();
    for (const item of filtered) {
      if (item.arrivedOn) marked.add(Number(item.arrivedOn.slice(0, 4)));
    }
    return marked;
  }, [filtered]);
  const placed = filtered.filter((item) => item.arrivedOn !== null && item.arrivedOn >= from && item.arrivedOn <= through);
  const clusters = clusterHardware(placed);
  const activeCluster = clusters.find((cluster) => cluster.id === selectedCluster) ?? null;
  const activeHardware =
    activeCluster?.items.find((item) => item.id === selectedHardware) ?? activeCluster?.items[0] ?? null;
  const yearEvents = archive.timeline.filter((event) => event.occurredOn?.startsWith(String(endYear)));
  const objectPins = activeCluster?.items.filter((item) => item.pin?.specificity === "object") ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.9fr)]">
      <form className="surface col-span-full flex flex-wrap items-end gap-3 p-3" onSubmit={(event) => event.preventDefault()}>
        <label className="field" htmlFor="mission-filter">
          Mission
          <select
            id="mission-filter"
            className="control"
            value={mission}
            onChange={(event) => setMission(event.target.value)}
          >
            <option value="">All missions</option>
            {archive.missions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field" htmlFor="type-filter">
          Type
          <select id="type-filter" className="control" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">All types</option>
            {archive.types.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field min-w-48 flex-1" htmlFor="archive-search">
          Search
          <input
            id="archive-search"
            className="control w-full"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Eagle, rover, seismometer"
          />
        </label>
      </form>

      <section className="surface min-h-0 p-3 lg:min-h-[34rem]" aria-labelledby="moon-map-title">
        <p id="moon-map-title" className="eyebrow">
          Moon, equirectangular
        </p>
        <div className="map-frame" role="group" aria-label="Map of NASA hardware on the Moon">
          {clusters.map((cluster) => (
            <button
              key={cluster.id}
              type="button"
              className="pin"
              style={project(cluster.latitudeDeg, cluster.longitudeDeg)}
              data-kind={pinKind(cluster)}
              data-selected={cluster.id === activeCluster?.id}
              aria-pressed={cluster.id === activeCluster?.id}
              aria-label={clusterLabel(cluster)}
              onClick={() => {
                setSelectedCluster(cluster.id);
                setSelectedHardware(cluster.items[0]?.id ?? null);
              }}
            >
              {cluster.items.length > 1 ? (
                <span className="absolute -top-2 -right-2 min-w-4 rounded-full bg-paper text-center font-ui text-[0.65rem] leading-4 text-ink dark:bg-paper-inverse dark:text-ink-inverse">
                  {cluster.items.length}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <p className="quiet mt-3">
          {clusters.length === 1 ? "1 place" : `${clusters.length} places`} on the Moon {during(startYear, endYear)}. Hardware within about 2 kilometers shares one
          marker. Gold is equipment on the surface, rust is an impact, and green is a site pin.
        </p>
      </section>

      <aside className="surface min-h-0 overflow-auto p-4 lg:min-h-[34rem]" aria-label="Selected hardware">
        {activeHardware && activeCluster ? (
          <div className="grid gap-3">
            <div>
              <p className="eyebrow">{activeHardware.mission.name}</p>
              <h2 className="m-0 text-2xl font-medium tracking-tight">{activeHardware.name}</h2>
            </div>
            <p className="m-0">{activeHardware.summary}</p>
            <p className="m-0 flex flex-wrap gap-2">
              <span className="tag">{activeHardware.type.name}</span>
              <span className="tag">{activeHardware.restingLabel}</span>
              <span className="tag">{activeHardware.conditionLabel}</span>
            </p>
            {activeHardware.pin ? (
              <p className="quiet m-0">
                {activeHardware.pin.specificity === "site" && activeHardware.pin.inheritedFrom
                  ? `Shown at ${activeHardware.pin.inheritedFrom.name}: `
                  : "Coordinate: "}
                {formatCoordinate(activeHardware.pin.latitudeDeg, activeHardware.pin.longitudeDeg)}
              </p>
            ) : (
              <p className="quiet m-0">No published coordinate.</p>
            )}
            <p className="m-0">
              <Link href={`/hardware/${activeHardware.id}`}>Open the full record</Link>
            </p>
            {objectPins.length > 1 ? (
              <div className="grid gap-2">
                <p className="eyebrow">Objects at this site</p>
                <div className="relative h-44 rounded-xl bg-map dark:bg-map-inverse" aria-hidden="true">
                  {objectPins.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="pin"
                      style={insetStyle(item, objectPins)}
                      data-kind={item.restingState === "impacted" ? "impact" : "object"}
                      data-selected={item.id === activeHardware.id}
                      tabIndex={-1}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            <div className="grid">
              {activeCluster.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="hit border-t border-rule py-3 dark:border-rule-inverse"
                  aria-pressed={item.id === activeHardware.id}
                  onClick={() => setSelectedHardware(item.id)}
                >
                  <strong className="block">{item.name}</strong>
                  <span className="quiet">
                    {item.mission.name}
                    {" · "}
                    {item.pin?.specificity === "site" ? "Uses the station pin" : item.pin ? "Own coordinate" : "No pin"}
                    {item.arrivedOn ? ` · ${formatDay(item.arrivedOn)}` : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            <div>
              <p className="eyebrow">Archive</p>
              <h2 className="m-0 text-2xl font-medium tracking-tight">Hardware left on the Moon</h2>
            </div>
            <p className="m-0">
              Choose a marker, or a span of years. The map keeps everything dated {during(startYear, endYear)}. Every pin comes from a NASA
              coordinate. Records without one stay in the list below and are not guessed onto the map.
            </p>
            <p className="quiet m-0">
              {placed.length} of {filtered.length} matching records {placed.length === 1 ? "is" : "are"} on the Moon {during(startYear, endYear)}.
            </p>
          </div>
        )}
      </aside>

      <section className="surface col-span-full grid gap-3 p-4" aria-label="Year">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            className="shrink-0 rounded-full border border-rule bg-control px-3 py-1.5 font-ui text-sm hover:border-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:bg-paper2 dark:border-rule-inverse dark:bg-control-inverse dark:hover:border-gold-inverse dark:active:bg-paper2-inverse"
            type="button"
            aria-pressed={playing}
            onClick={() => {
              if (!playing && endIndex >= years.length - 1) {
                const origin = startIndex >= years.length - 1 ? 0 : startIndex;
                if (startIndex !== origin) setStartIndex(origin);
                setEndIndex(origin);
              }
              setPlaying((value) => !value);
            }}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <div className="min-w-0 flex-1">
            <YearRail
              years={years}
              startYear={startYear}
              endYear={endYear}
              arrivalYears={arrivalYears}
              onChange={(nextStart, nextEnd) => {
                setPlaying(false);
                const start = years.indexOf(nextStart);
                const end = years.indexOf(nextEnd);
                if (start !== -1) setStartIndex(start);
                if (end !== -1) setEndIndex(end);
              }}
            />
          </div>
        </div>
        <p className="quiet m-0">
          {arrivalCaption(startYear, endYear, placed.length)} Gold dots mark years when hardware arrived. Drag either end, or use the arrow keys.
        </p>
        <div className="flex gap-2 overflow-auto pb-1">
          {startYear !== endYear && yearEvents.length > 0 ? <p className="quiet m-0 shrink-0 self-center">Events in {endYear}.</p> : null}
          {yearEvents.length === 0 ? <p className="quiet m-0">No dated events in {endYear}.</p> : null}
          {yearEvents.map((event) => (
            <button
              key={event.id}
              type="button"
              className="hit min-w-56 shrink-0 border border-rule bg-control p-3 dark:border-rule-inverse dark:bg-control-inverse"
              onClick={() => {
                if (!event.hardware) return;
                const cluster = clusters.find((item) => item.items.some((hardware) => hardware.id === event.hardware?.id));
                if (!cluster) return;
                setSelectedCluster(cluster.id);
                setSelectedHardware(event.hardware.id);
              }}
            >
              <strong className="block">{event.title}</strong>
              <span className="quiet">
                {event.occurredOn ? formatDay(event.occurredOn) : "Date unpublished"} · {event.hardware?.name ?? event.mission.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="surface col-span-full grid gap-3 p-4" aria-labelledby="ledger-title">
        <div>
          <h2 id="ledger-title" className="m-0 text-2xl font-medium tracking-tight">
            Ledger
          </h2>
          <p className="quiet m-0 mt-2">
            Dim rows arrived outside {startYear === endYear ? startYear : `${startYear}–${endYear}`}.
          </p>
        </div>
        <ul className="m-0 grid list-none gap-1 p-0">
          {filtered.map((item) => {
            const outside = item.arrivedOn !== null && (item.arrivedOn < from || item.arrivedOn > through);
            return (
              <li key={item.id}>
                <Link
                  href={`/hardware/${item.id}`}
                  className="grid grid-cols-1 gap-1 rounded-lg px-1 py-2 no-underline hover:bg-gold/10 focus-visible:bg-gold/10 active:bg-gold/20 sm:grid-cols-[minmax(0,1.4fr)_minmax(8rem,0.6fr)_auto] sm:items-baseline sm:gap-3 data-[outside=true]:opacity-45 dark:hover:bg-gold-inverse/10 dark:focus-visible:bg-gold-inverse/10 dark:active:bg-gold-inverse/20"
                  data-outside={outside}
                >
                  <span>{item.name}</span>
                  <span className="quiet">{item.mission.name}</span>
                  <span className="quiet">
                    {item.pin ? (item.pin.specificity === "site" ? "Site pin" : "Own pin") : "No pin"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
