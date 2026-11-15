"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BASEMAPS,
  CLUSTER_LABEL_RANK,
  CLUSTER_RADIUS_PX,
  MARKER_KINDS,
  markerKind,
  type MarkerKindId,
} from "@/constants/map";
import { formatDay, yearEnd, yearsFrom } from "@/app/lib/archive/geo";
import type { ArchiveSnapshot, EventDetail, HardwareListItem } from "@/types/archive";
import type { EventStory } from "@/types/story";
import { BodyTabs } from "@/app/components/body-tabs";
import { YearRail } from "@/app/components/year-rail";

type Cluster = {
  id: string;
  latitudeDeg: number;
  longitudeDeg: number;
  items: HardwareListItem[];
};

type ArchiveExplorerProps = {
  archive: ArchiveSnapshot;
  initialType?: string;
  initialQuery?: string;
  initialStartYear?: string;
  initialEndYear?: string;
  initialSort?: string;
};

type PinPosition = Pick<CSSProperties, "left" | "top">;
type LedgerSort = "name" | "mission" | "date" | "type";

type StoryApiResponse = {
  data: {
    eventId: string;
    story: EventStory;
  } | null;
  error: {
    code: string;
    message: string;
  } | null;
};

<<<<<<< HEAD
const SORT_OPTIONS: { id: LedgerSort; label: string }[] = [
  { id: "name", label: "Name" },
  { id: "mission", label: "Mission" },
  { id: "date", label: "Arrival date" },
  { id: "type", label: "Type" },
];
=======
const LONGITUDES = [-180, -120, -60, 0, 60, 120, 180];
const LATITUDES = [90, 60, 30, 0, -30, -60, -90];

const KIND_CLASS: Record<MarkerKindId, string> = {
  lander: "text-marker-lander",
  rover: "text-marker-rover",
  impact: "text-marker-impact",
  experiment: "text-marker-experiment",
};

const KIND_STROKE: Record<MarkerKindId, string> = {
  lander: "stroke-marker-lander",
  rover: "stroke-marker-rover",
  impact: "stroke-marker-impact",
  experiment: "stroke-marker-experiment",
};

type ScreenPoint = {
  item: HardwareListItem;
  x: number;
  y: number;
};

/** Shortest pixel gap, wrapping at the date line so the map edges stay neighbors. */
function screenDistance(a: ScreenPoint, b: ScreenPoint, width: number): number {
  let dx = Math.abs(a.x - b.x);
  if (dx > width / 2) dx = width - dx;
  return Math.hypot(dx, a.y - b.y);
}

/** Mean coordinate. Longitudes are unwrapped so a group on the date line does not average to the prime meridian. */
function meanPosition(items: HardwareListItem[]): { latitudeDeg: number; longitudeDeg: number } {
  const latitudeDeg = items.reduce((sum, item) => sum + item.pin!.latitudeDeg, 0) / items.length;
  const origin = items[0].pin!.longitudeDeg;
  const unwrapped = items.reduce((sum, item) => {
    let delta = item.pin!.longitudeDeg - origin;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return sum + delta;
  }, 0);
  const longitudeDeg = ((origin + unwrapped / items.length + 540) % 360) - 180;
  return { latitudeDeg, longitudeDeg };
}
>>>>>>> origin/main

/**
 * Groups pins that would overlap at this map size.
 * A cluster is the densest remaining pin plus every unused pin within CLUSTER_RADIUS_PX of it.
 * Reach stays one radius, the way Supercluster does, so a chain of sites cannot collapse into one bubble.
 * Returns nothing until the frame has been measured.
 */
function clusterHardware(items: HardwareListItem[], width: number, height: number): Cluster[] {
  if (width <= 0 || height <= 0) return [];
  const points: ScreenPoint[] = items.flatMap((item) => {
    if (!item.pin) return [];
    return [
      {
        item,
        x: ((item.pin.longitudeDeg + 180) / 360) * width,
        y: ((90 - item.pin.latitudeDeg) / 180) * height,
      },
    ];
  });

  const used = points.map(() => false);
  const groups: HardwareListItem[][] = [];
  let remaining = points.length;

  while (remaining > 0) {
    let seed = -1;
    let seedNeighbors = -1;
    for (let i = 0; i < points.length; i += 1) {
      if (used[i]) continue;
      let neighbors = 0;
      for (let j = 0; j < points.length; j += 1) {
        if (used[j]) continue;
        if (screenDistance(points[i], points[j], width) <= CLUSTER_RADIUS_PX) neighbors += 1;
      }
      if (neighbors > seedNeighbors) {
        seed = i;
        seedNeighbors = neighbors;
      }
    }

    if (seed < 0) break;
    const group = [points[seed].item];
    used[seed] = true;
    remaining -= 1;
    for (let j = 0; j < points.length; j += 1) {
      if (used[j]) continue;
      if (screenDistance(points[seed], points[j], width) <= CLUSTER_RADIUS_PX) {
        group.push(points[j].item);
        used[j] = true;
        remaining -= 1;
      }
    }
    groups.push(group);
  }

  return groups.map((group) => {
    const itemsInOrder = [...group].sort((a, b) => a.name.localeCompare(b.name));
    const position = meanPosition(itemsInOrder);
    return {
      id: itemsInOrder
        .map((item) => item.id)
        .sort()
        .join("|"),
      latitudeDeg: position.latitudeDeg,
      longitudeDeg: position.longitudeDeg,
      items: itemsInOrder,
    };
  });
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 24;

type MapView = {
  zoom: number;
  x: number;
  y: number;
};

/** Keeps the view on the map. Zoom 1 is the whole world, centered. */
function clampView(view: MapView): MapView {
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.zoom));
  if (zoom <= MIN_ZOOM) return { zoom: MIN_ZOOM, x: 0.5, y: 0.5 };
  const margin = 0.5 / zoom;
  return {
    zoom,
    x: Math.min(1 - margin, Math.max(margin, view.x)),
    y: Math.min(1 - margin, Math.max(margin, view.y)),
  };
}

/**
 * Next zoom at which this bubble breaks apart.
 * Each step doubles, matching the click-to-expand step used by web maps.
 * Returns null when the records still share a marker at maximum zoom, so the click opens the list instead.
 */
function expansionZoom(cluster: Cluster, frameWidth: number, frameHeight: number, current: number): number | null {
  if (frameWidth <= 0 || frameHeight <= 0 || cluster.items.length < 2) return null;
  const stillOne = (zoom: number) => clusterHardware(cluster.items, frameWidth * zoom, frameHeight * zoom).length <= 1;
  if (stillOne(MAX_ZOOM)) return null;
  let next = Math.min(MAX_ZOOM, current * 2);
  while (next < MAX_ZOOM && stillOne(next)) next = Math.min(MAX_ZOOM, next * 2);
  return stillOne(next) ? null : next;
}

function rankOf(typeId: string): number {
  const index = CLUSTER_LABEL_RANK.indexOf(typeId as (typeof CLUSTER_LABEL_RANK)[number]);
  return index === -1 ? CLUSTER_LABEL_RANK.length : index;
}

function leadItem(cluster: Cluster): HardwareListItem {
  return [...cluster.items].sort((a, b) => rankOf(a.type.id) - rankOf(b.type.id))[0];
}

function clusterLabel(cluster: Cluster): string {
  if (cluster.items.length === 1) return cluster.items[0].name;
  const missions = new Set(cluster.items.map((item) => item.mission.name));
  const countLabel = `${cluster.items.length} records`;
  if (missions.size === 1) return `${cluster.items[0].mission.name} site, ${countLabel}`;
  return countLabel;
}

function clusterKind(cluster: Cluster): MarkerKindId {
  return markerKind(leadItem(cluster).type.id) ?? "lander";
}

/** Equirectangular placement. Percentages stay inline because each pin has its own coordinate. */
function project(latitudeDeg: number, longitudeDeg: number): PinPosition {
  return {
    left: `${((longitudeDeg + 180) / 360) * 100}%`,
    top: `${((90 - latitudeDeg) / 180) * 100}%`,
  };
}

function longitudeLabel(value: number): string {
  if (value === 0) return "0°";
  return `${Math.abs(value)}° ${value > 0 ? "E" : "W"}`;
}

function latitudeLabel(value: number): string {
  if (value === 0) return "0°";
  return `${Math.abs(value)}° ${value > 0 ? "N" : "S"}`;
}

/** Inclusive years that contain a dated arrival. Falls back when the archive has none. */
function archiveYears(archive: ArchiveSnapshot): number[] {
  const found: number[] = [];
  for (const item of archive.hardware) {
    if (item.arrivedOn) found.push(Number(item.arrivedOn.slice(0, 4)));
  }
  if (found.length === 0) return yearsFrom("1964", "2014");
  return yearsFrom(String(Math.min(...found)), String(Math.max(...found)));
}

function MarkerGlyph({ kind, className = "size-4" }: { kind: MarkerKindId; className?: string }) {
  const glyphClass = `${className} ${KIND_CLASS[kind]}`;
  if (kind === "rover") {
    return (
      <svg viewBox="0 0 16 16" className={glyphClass} aria-hidden="true">
        <polygon points="8,1.6 14.4,8 8,14.4 1.6,8" fill="currentColor" stroke="white" strokeWidth="1.4" />
      </svg>
    );
  }
  if (kind === "impact") {
    return (
      <svg viewBox="0 0 16 16" className={glyphClass} aria-hidden="true">
        <polygon points="8,1.6 14.4,14.4 1.6,14.4" fill="currentColor" stroke="white" strokeWidth="1.4" />
      </svg>
    );
  }
  if (kind === "experiment") {
    return (
      <svg viewBox="0 0 16 16" className={glyphClass} aria-hidden="true">
        <rect x="2.4" y="2.4" width="11.2" height="11.2" rx="1.4" fill="currentColor" stroke="white" strokeWidth="1.4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className={glyphClass} aria-hidden="true">
      <circle cx="8" cy="8" r="5.4" fill="currentColor" stroke="white" strokeWidth="1.4" />
    </svg>
  );
}

<<<<<<< HEAD
export default function ArchiveExplorer({
  archive,
  initialMission,
  initialType,
  initialQuery,
  initialStartYear,
  initialEndYear,
  initialSort,
}: ArchiveExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const years = useMemo(
    () => archiveYears(archive),
    [archive],
=======
/**
 * One circle for a group. The ring is split by hardware type, and the count sits in the hole
 * so the badge is not a second marker.
 */
function ClusterBubble({ items }: { items: HardwareListItem[] }) {
  const total = items.length;
  const counts = new Map<MarkerKindId, number>();
  for (const item of items) {
    const kind = markerKind(item.type.id) ?? "lander";
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  const parts = MARKER_KINDS.flatMap((kind) => {
    const count = counts.get(kind.id) ?? 0;
    return count > 0 ? [{ kind: kind.id, count }] : [];
  });
  const radius = 13;
  const circumference = 2 * Math.PI * radius;
  const gap = parts.length > 1 ? 1.6 : 0;
  const usable = circumference - gap * parts.length;
  const segments: Array<{ kind: MarkerKindId; length: number; dashOffset: number }> = [];
  let offset = 0;
  for (const part of parts) {
    const length = Math.max((part.count / total) * usable, 0.5);
    segments.push({ kind: part.kind, length, dashOffset: offset });
    offset += length + gap;
  }

  return (
    <svg viewBox="0 0 36 36" className="size-full" aria-hidden="true">
      <circle cx="18" cy="18" r={radius} fill="none" className="stroke-white" strokeWidth="7" />
      <circle cx="18" cy="18" r="9.5" className="fill-paper" />
      {segments.map((part) => (
        <circle
          key={part.kind}
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          className={KIND_STROKE[part.kind]}
          strokeWidth="5"
          strokeDasharray={`${part.length} ${circumference - part.length}`}
          strokeDashoffset={-part.dashOffset}
          transform="rotate(-90 18 18)"
        />
      ))}
      <text
        x="18"
        y="18"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-ink font-ui font-bold"
        fontSize={total >= 10 ? 10 : 12}
      >
        {total}
      </text>
    </svg>
>>>>>>> origin/main
  );
}

<<<<<<< HEAD
  const initialStartIndex = Math.max(
    0,
    years.indexOf(Number(initialStartYear)),
  );

  const initialEndIndex = Math.max(
    initialStartIndex,
    years.indexOf(Number(initialEndYear)),
  );

  const [startIndex, setStartIndex] =
    useState(initialStartIndex);

  const [endIndex, setEndIndex] = useState(
    years.includes(Number(initialEndYear))
      ? initialEndIndex
      : years.length - 1,
  );

  const [playing, setPlaying] = useState(false);

  const [mission, setMission] = useState(initialMission ?? "");
  const [type, setType] = useState(initialType ?? "");
  const [query, setQuery] = useState(initialQuery ?? "");

  const [sort, setSort] = useState<LedgerSort>(
    initialSort === "mission" ||
      initialSort === "date" ||
      initialSort === "type"
      ? initialSort
      : "name",
  );

  const [selectedCluster, setSelectedCluster] =
    useState<string | null>(null);

  const [selectedHardware, setSelectedHardware] =
    useState<string | null>(null);

  // Storytelling state
  const [selectedEvent, setSelectedEvent] =
    useState<EventDetail | null>(null);

  const [story, setStory] =
    useState<EventStory | null>(null);

  const [storyLoading, setStoryLoading] =
    useState(false);

  const [storyError, setStoryError] =
    useState<string | null>(null);
=======
/** Earliest event for the lead record in this cluster, otherwise the earliest event here. */
function storyEventForCluster(timeline: EventDetail[], cluster: Cluster): EventDetail | null {
  const ids = new Set(cluster.items.map((item) => item.id));
  const events = timeline.filter((event) => event.hardware !== null && ids.has(event.hardware.id));
  const leadId = leadItem(cluster).id;
  return events.find((event) => event.hardware?.id === leadId) ?? events[0] ?? null;
}

function toggleValue(current: string[], id: string): string[] {
  return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
}
>>>>>>> origin/main

/**
 * Equirectangular map, a compact hardware-type filter, and a single year.
 * An empty type filter shows every record. Selecting one or more narrows the map.
 * Clicking a resolved pin loads its story under the year slider, and the page scrolls to it.
 */
export default function ArchiveExplorer({ archive, initialType }: ArchiveExplorerProps) {
  const years = useMemo(() => archiveYears(archive), [archive]);
  const kinds = useMemo(
    () => MARKER_KINDS.filter((kind) => archive.hardware.some((item) => markerKind(item.type.id) === kind.id)),
    [archive.hardware],
  );
  const [year, setYear] = useState(years[years.length - 1] ?? years[0]);
  const [selectedKinds, setSelectedKinds] = useState<string[]>(() => {
    const kind = initialType ? markerKind(initialType) : null;
    return kind ? [kind] : [];
  });
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const [story, setStory] = useState<EventStory | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);
  const [storyRetry, setStoryRetry] = useState(0);
  const [view, setView] = useState<MapView>({ zoom: MIN_ZOOM, x: 0.5, y: 0.5 });
  const frameRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef(view);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const draggedRef = useRef(false);
  const storyRef = useRef<HTMLElement>(null);
  const [frame, setFrame] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      setFrame((current) => (current.width === width && current.height === height ? current : { width, height }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const current = viewRef.current;
      const factor = event.deltaY > 0 ? 1 / 1.25 : 1.25;
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.zoom * factor));
      const mapX = current.x + (px - 0.5) / current.zoom;
      const mapY = current.y + (py - 0.5) / current.zoom;
      setView(
        clampView({
          zoom,
          x: mapX - (px - 0.5) / zoom,
          y: mapY - (py - 0.5) / zoom,
        }),
      );
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  const selectedEventId = selectedEvent?.id;

  useEffect(() => {
    if (!selectedEventId) return;
    const eventId = selectedEventId;
    const controller = new AbortController();

    async function loadStory() {
      try {
        const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/story`, {
          method: "POST",
          signal: controller.signal,
        });
        const result = (await response.json()) as StoryApiResponse;
        if (!response.ok || !result.data) {
          throw new Error(result.error?.message ?? "Unable to load this story.");
        }
        if (result.data.eventId !== eventId) {
          throw new Error("The storytelling response did not match the selected event.");
        }
        if (controller.signal.aborted) return;
        setStory(result.data.story);
        setStoryError(null);
      } catch (error) {
        if (controller.signal.aborted) return;
        setStoryError(error instanceof Error ? error.message : "An unexpected error occurred.");
      } finally {
        if (!controller.signal.aborted) setStoryLoading(false);
      }
    }

    void loadStory();
    return () => controller.abort();
  }, [selectedEventId, storyRetry]);

  useEffect(() => {
    if (!selectedEventId) return;
    storyRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedEventId]);

<<<<<<< HEAD
  const startYear = Math.min(rawStart, rawEnd);
  const endYear = Math.max(rawStart, rawEnd);

  const from = yearStart(startYear);
  const through = yearEnd(endYear);

  useEffect(() => {
    const params = new URLSearchParams(
      searchParams.toString(),
    );

    if (mission) params.set("mission", mission);
    else params.delete("mission");

    if (type) params.set("type", type);
    else params.delete("type");

    if (query) params.set("q", query);
    else params.delete("q");

    if (startYear !== years[0]) {
      params.set("start", String(startYear));
    } else {
      params.delete("start");
    }

    if (endYear !== years[years.length - 1]) {
      params.set("end", String(endYear));
    } else {
      params.delete("end");
    }

    if (sort !== "name") params.set("sort", sort);
    else params.delete("sort");

    const next = params.toString();
    const current = searchParams.toString();
    if (next === current) return;
    router.replace(next ? `${pathname}?${next}` : pathname, {
      scroll: false,
    });
  }, [
    endYear,
    mission,
    pathname,
    query,
    router,
    searchParams,
    sort,
    startYear,
    type,
    years,
  ]);

  const filtered = useMemo(
    () =>
      filterHardware(archive.hardware, {
        mission: mission || undefined,
        type: type || undefined,
        q: query || undefined,
      }),
    [archive.hardware, mission, type, query],
  );

  const sortedFiltered = useMemo(() => {
    const items = [...filtered];
    items.sort((a, b) => {
      if (sort === "mission") {
        return a.mission.name.localeCompare(
          b.mission.name,
        );
      }

      if (sort === "type") {
        return a.type.name.localeCompare(b.type.name);
      }

      if (sort === "date") {
        if (!a.arrivedOn && !b.arrivedOn) {
          return a.name.localeCompare(b.name);
        }

        if (!a.arrivedOn) return 1;
        if (!b.arrivedOn) return -1;
        return a.arrivedOn.localeCompare(b.arrivedOn);
      }

      return a.name.localeCompare(b.name);
    });
    return items;
  }, [filtered, sort]);

  const arrivalYears = useMemo(() => {
    const marked = new Set<number>();

    for (const item of filtered) {
      if (item.arrivedOn) {
        marked.add(Number(item.arrivedOn.slice(0, 4)));
      }
    }

    return marked;
  }, [filtered]);

  const placed = filtered.filter(
    (item) =>
      item.arrivedOn !== null &&
      item.arrivedOn >= from &&
      item.arrivedOn <= through,
  );

  const metersPerDegree =
    METERS_PER_DEGREE[archive.body.id] ??
    METERS_PER_DEGREE.moon;

  const clusters = clusterHardware(
    placed,
    metersPerDegree,
  );

=======
  const through = yearEnd(year);
  const matching = archive.hardware.filter((item) => {
    const kind = markerKind(item.type.id);
    if (selectedKinds.length > 0 && (!kind || !selectedKinds.includes(kind))) return false;
    return true;
  });
  const placed = matching.filter((item) => item.pin && item.arrivedOn !== null && item.arrivedOn <= through);
  const clusters = useMemo(
    () => clusterHardware(placed, frame.width * view.zoom, frame.height * view.zoom),
    [placed, frame.width, frame.height, view.zoom],
  );
  const activeCluster = clusters.find((cluster) => cluster.id === selectedCluster) ?? null;
  const basemap = BASEMAPS[archive.body.id];
>>>>>>> origin/main
  const world = archive.body.name;
  const onWorld = world === "Moon" ? "the Moon" : world;

<<<<<<< HEAD
  const onWorld =
    world === "Moon" ? "the Moon" : world;

  const activeCluster =
    clusters.find(
      (cluster) => cluster.id === selectedCluster,
    ) ??
    clusters[0] ??
    null;

  const activeHardware =
    activeCluster?.items.find(
      (item) => item.id === selectedHardware,
    ) ??
    activeCluster?.items[0] ??
    null;

  const yearEvents = archive.timeline.filter(
    (event) =>
      event.occurredOn?.startsWith(String(endYear)),
  );

  const objectPins =
    activeCluster?.items.filter(
      (item) => item.pin?.specificity === "object",
    ) ?? [];

  // Select an event and initialize its loading state.
=======
>>>>>>> origin/main
  function handleSelectEvent(event: EventDetail) {
    setSelectedEvent(event);
    setStory(null);
    setStoryError(null);
    setStoryLoading(true);
  }

  function handleCloseStory() {
    setSelectedEvent(null);
    setStory(null);
    setStoryError(null);
    setStoryLoading(false);
  }

  function handleRetryStory() {
    setStory(null);
    setStoryError(null);
    setStoryLoading(true);
    setStoryRetry((value) => value + 1);
  }

  function handleResetFilters() {
    setMission("");
    setType("");
    setQuery("");
    setSort("name");
    setPlaying(false);
    setStartIndex(0);
    setEndIndex(years.length - 1);
  }

  return (
<<<<<<< HEAD
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.9fr)]">
      <div className="col-span-full">
        <BodyTabs
          bodyId={archive.body.id}
          basePath="/"
        />
      </div>

      {/* Filters */}
      <form
        className="surface col-span-full grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="field w-full" htmlFor="mission-filter">
          Mission

          <select
            id="mission-filter"
            className="control w-full min-w-0"
            value={mission}
            onChange={(event) =>
              setMission(event.target.value)
            }
          >
            <option value="">All missions</option>

            {archive.missions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field w-full" htmlFor="type-filter">
          Type

          <select
            id="type-filter"
            className="control w-full min-w-0"
            value={type}
            onChange={(event) =>
              setType(event.target.value)
            }
          >
            <option value="">All types</option>

            {archive.types.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label
          className="field w-full min-w-0"
          htmlFor="archive-search"
        >
          Search

          <input
            id="archive-search"
            className="control w-full"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder={
              archive.body.id === "mars"
                ? "Viking, rover, helicopter"
                : "Eagle, rover, seismometer"
            }
          />
        </label>

        <label className="field w-full" htmlFor="ledger-sort">
          Ledger sort
          <select
            id="ledger-sort"
            className="control w-full min-w-0"
            value={sort}
            onChange={(event) =>
            setSort(event.target.value as LedgerSort)
            }
          >
            {SORT_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-end gap-2 lg:justify-end">
          <button
            type="button"
            className="hit rounded-full border border-rule px-3 py-2 font-ui text-sm dark:border-rule-inverse"
            onClick={handleResetFilters}
          >
            Reset filters
          </button>
        </div>
      </form>

      {/* Map */}
=======
    <div className={selectedEvent ? "flex flex-col gap-2" : "flex min-h-0 flex-1 flex-col gap-2"}>
>>>>>>> origin/main
      <section
        className={
          selectedEvent
            ? "surface flex h-[calc(100dvh-9rem)] min-h-80 shrink-0 flex-col p-2"
            : "surface flex min-h-0 min-w-0 flex-1 flex-col p-2"
        }
        aria-labelledby="archive-map-title"
      >
<<<<<<< HEAD
        <p id="archive-map-title" className="eyebrow">
          {world}, equirectangular
        </p>

        <div
          className="map-frame"
          role="group"
          aria-label={`Map of NASA hardware on ${onWorld}`}
        >
          {clusters.length === 0 ? (
            <div className="absolute inset-0 z-20 grid place-items-center p-4 text-center">
              <p className="m-0 max-w-sm rounded-xl bg-paper/80 p-3 font-ui text-sm text-ink dark:bg-paper-inverse/80 dark:text-ink-inverse">
                No mapped hardware matches this filter and year span. Reset filters or expand the years.
              </p>
            </div>
          ) : null}

          {clusters.map((cluster) => (
            <button
              key={cluster.id}
              type="button"
              className="pin"
              style={project(
                cluster.latitudeDeg,
                cluster.longitudeDeg,
              )}
              data-kind={pinKind(cluster)}
              data-selected={
                cluster.id === activeCluster?.id
              }
              aria-pressed={
                cluster.id === activeCluster?.id
              }
              aria-label={clusterLabel(cluster)}
              onClick={() => {
                setSelectedCluster(cluster.id);

                setSelectedHardware(
                  cluster.items[0]?.id ?? null,
                );
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

        <ul className="mt-3 mb-0 grid list-none gap-2 p-0 font-ui text-sm sm:grid-cols-3">
          <li className="flex items-center gap-2">
            <span className="inline-block size-3 rounded-full border border-gold2 bg-gold dark:border-gold2-inverse dark:bg-gold-inverse" />
            Surface equipment
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block size-3 rounded-full border border-gold2 bg-impact dark:border-gold2-inverse dark:bg-impact-inverse" />
            Impact
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block size-3 rounded-full border border-gold2 bg-sea dark:border-gold2-inverse dark:bg-sea-inverse" />
            Site coordinate
          </li>
        </ul>

        <p className="quiet mt-3">
          {clusters.length === 1
            ? "1 place"
            : `${clusters.length} places`}{" "}
          on {onWorld} {during(startYear, endYear)}.
          Hardware within about 2 kilometers shares one
          marker.
        </p>
        <p className="quiet m-0">
          Keyboard tip: tab to a marker and press Enter to open it.
        </p>
      </section>

      {/* Selected hardware sidebar */}
      <aside
        className="surface min-h-0 overflow-auto p-4 lg:min-h-[34rem]"
        aria-label="Selected hardware"
      >
        {activeHardware && activeCluster ? (
          <div className="grid gap-3">
            <div>
              <p className="eyebrow">
                {activeHardware.mission.name}
              </p>

              <h2 className="m-0 text-2xl font-medium tracking-tight">
                {activeHardware.name}
              </h2>
            </div>

            <p className="m-0">
              {activeHardware.summary}
            </p>

            <p className="m-0 flex flex-wrap gap-2">
              <span className="tag">
                {activeHardware.type.name}
              </span>

              <span className="tag">
                {activeHardware.restingLabel}
              </span>

              <span className="tag">
                {activeHardware.conditionLabel}
              </span>
            </p>

            {activeHardware.pin ? (
              <p className="quiet m-0">
                {activeHardware.pin.specificity ===
                  "site" &&
                activeHardware.pin.inheritedFrom
                  ? `Shown at ${activeHardware.pin.inheritedFrom.name}: `
                  : "Coordinate: "}

                {formatCoordinate(
                  activeHardware.pin.latitudeDeg,
                  activeHardware.pin.longitudeDeg,
                )}
              </p>
            ) : (
              <p className="quiet m-0">
                No published coordinate.
              </p>
            )}

            <p className="m-0">
              <Link
                href={`/hardware/${activeHardware.id}`}
              >
                Open the full record
              </Link>
            </p>

            {objectPins.length > 1 ? (
              <div className="grid gap-2">
                <p className="eyebrow">
                  Objects at this site
                </p>

                <div
                  className="relative h-44 rounded-xl bg-map dark:bg-map-inverse"
                  aria-hidden="true"
                >
                  {objectPins.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="pin"
                      style={insetStyle(
                        item,
                        objectPins,
                      )}
                      data-kind={
                        item.restingState === "impacted"
                          ? "impact"
                          : "object"
                      }
                      data-selected={
                        item.id === activeHardware.id
                      }
                      tabIndex={-1}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid">
              {activeCluster.items.map((item) => (
=======
        <div className="mb-2 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1">
          <h2 id="archive-map-title" className="sr-only">
            Map of NASA hardware on {onWorld}
          </h2>
          <BodyTabs bodyId={archive.body.id} basePath="/" />
          <fieldset className="m-0 flex flex-wrap items-center gap-1 border-0 p-0">
            <legend className="sr-only">Hardware type. Leave every type clear to show all types.</legend>
            {kinds.map((kind) => {
              const on = selectedKinds.includes(kind.id);
              return (
>>>>>>> origin/main
                <button
                  key={kind.id}
                  type="button"
                  aria-pressed={on}
                  className={`inline-flex h-5 items-center gap-1 rounded-full border px-1.5 font-ui text-[0.65rem] leading-none hover:border-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:bg-gold/20 ${
                    on ? "border-gold bg-gold/15 text-ink" : "border-rule bg-control text-ink"
                  }`}
                  onClick={() => setSelectedKinds((current) => toggleValue(current, kind.id))}
                >
                  <MarkerGlyph kind={kind.id} className="size-2.5" />
                  {kind.label}
                </button>
              );
            })}
          </fieldset>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center [container-type:size]">
        <div
          ref={frameRef}
          className="map-frame w-[min(100cqw,calc(100cqh*2))] cursor-grab touch-none active:cursor-grabbing"
          role="group"
          aria-label={`Equirectangular map of NASA hardware on ${onWorld}`}
          onDragStart={(event) => event.preventDefault()}
          onPointerDown={(event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (target.closest("[data-pin], [data-callout], [data-zoom]")) return;
            dragRef.current = { x: event.clientX, y: event.clientY };
            draggedRef.current = false;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            const node = frameRef.current;
            if (!drag || !node) return;
            const dx = event.clientX - drag.x;
            const dy = event.clientY - drag.y;
            if (Math.hypot(dx, dy) < 3) return;
            draggedRef.current = true;
            drag.x = event.clientX;
            drag.y = event.clientY;
            const rect = node.getBoundingClientRect();
            const current = viewRef.current;
            setView(
              clampView({
                ...current,
                x: current.x - dx / (rect.width * current.zoom),
                y: current.y - dy / (rect.height * current.zoom),
              }),
            );
          }}
          onPointerUp={() => {
            dragRef.current = null;
          }}
          onClick={(event) => {
            if (draggedRef.current) {
              draggedRef.current = false;
              return;
            }
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (target.closest("[data-pin], [data-callout], [data-zoom]")) return;
            setSelectedCluster(null);
            handleCloseStory();
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${(0.5 - view.x) * view.zoom * 100}%, ${(0.5 - view.y) * view.zoom * 100}%) scale(${view.zoom})`,
              transformOrigin: "center center",
            }}
          >
          {basemap ? (
            // The mosaic has to fill the 2:1 frame exactly, or the pins drift off the published coordinates.
            // draggable is off so a click-drag pans the map instead of lifting a ghost of the JPEG.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={basemap.src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full"
              width={2048}
              height={1024}
            />
          ) : null}
          <div className="map-graticule pointer-events-none absolute inset-0" aria-hidden="true" />
          <span
            className="map-label map-label-corner top-1 left-1"
            style={{ transform: `scale(${1 / view.zoom})`, transformOrigin: "top left" }}
          >
            180° W/
            <br />
            90° N
          </span>
          {LONGITUDES.map((value, index) => {
            if (index === 0) return null;
            const atEnd = index === LONGITUDES.length - 1;
            return (
              <span
                key={`lon-${value}`}
                className="map-label top-1"
                style={{
                  left: atEnd ? undefined : `${((value + 180) / 360) * 100}%`,
                  right: atEnd ? "0.4rem" : undefined,
                  transform: atEnd ? `scale(${1 / view.zoom})` : `translate(-50%, 0) scale(${1 / view.zoom})`,
                  transformOrigin: atEnd ? "top right" : "center top",
                }}
              >
                {longitudeLabel(value)}
              </span>
            );
          })}
          {LATITUDES.map((value, index) => {
            if (index === 0) return null;
            const atEnd = index === LATITUDES.length - 1;
            return (
              <span
                key={`lat-${value}`}
                className="map-label left-1"
                style={{
                  top: atEnd ? undefined : `${((90 - value) / 180) * 100}%`,
                  bottom: atEnd ? "0.3rem" : undefined,
                  transform: atEnd ? `scale(${1 / view.zoom})` : `translate(0, -50%) scale(${1 / view.zoom})`,
                  transformOrigin: atEnd ? "bottom left" : "left center",
                }}
              >
                {latitudeLabel(value)}
              </span>
            );
          })}
          {clusters.map((cluster) => {
            const kind = clusterKind(cluster);
            const selected = cluster.id === activeCluster?.id;
            const nextZoom = expansionZoom(cluster, frame.width, frame.height, view.zoom);
            return (
              <div
                key={cluster.id}
                className={cluster.id === activeCluster?.id ? "absolute z-40" : "absolute z-20 hover:z-40 focus-within:z-40"}
                style={{
                  ...project(cluster.latitudeDeg, cluster.longitudeDeg),
                  transform: `scale(${1 / view.zoom})`,
                }}
              >
                <button
                  type="button"
                  className={cluster.items.length > 1 ? "pin pin-cluster" : "pin"}
                  data-pin="true"
                  data-kind={cluster.items.length > 1 ? undefined : kind}
                  data-selected={selected}
                  aria-pressed={selected}
                  aria-label={nextZoom === null ? clusterLabel(cluster) : `Zoom in on ${clusterLabel(cluster)}`}
                  onClick={() => {
                    if (nextZoom !== null) {
                      setSelectedCluster(null);
                      handleCloseStory();
                      setView(
                        clampView({
                          zoom: nextZoom,
                          x: (cluster.longitudeDeg + 180) / 360,
                          y: (90 - cluster.latitudeDeg) / 180,
                        }),
                      );
                      return;
                    }
                    setSelectedCluster(cluster.id);
                    const storyEvent = storyEventForCluster(archive.timeline, cluster);
                    if (storyEvent && storyEvent.id !== selectedEvent?.id) handleSelectEvent(storyEvent);
                    if (!storyEvent) handleCloseStory();
                  }}
                >
                  {cluster.items.length > 1 ? <ClusterBubble items={cluster.items} /> : <MarkerGlyph kind={kind} />}
                </button>
              </div>
            );
          })}
          </div>
<<<<<<< HEAD
        </div>

        <p className="quiet m-0">
          {arrivalCaption(
            startYear,
            endYear,
            placed.length,
          )}{" "}
          Gold dots mark years when hardware arrived.
          Drag either end, or use the arrow keys.
        </p>
        <p className="quiet m-0">
          On mobile, swipe the event cards. On keyboard, focus a year thumb and use arrows (Shift jumps 5 years).
        </p>

        <div className="flex snap-x snap-mandatory gap-2 overflow-auto pb-1">
          {startYear !== endYear &&
          yearEvents.length > 0 ? (
            <p className="quiet m-0 shrink-0 self-center snap-start">
              Events in {endYear}.
            </p>
          ) : null}

          {yearEvents.length === 0 ? (
            <p className="quiet m-0 snap-start">
              No dated events in {endYear}.
            </p>
          ) : null}

          {yearEvents.map((event) => (
=======
          <div data-zoom="true" className="absolute right-1.5 bottom-1.5 z-50 flex flex-col overflow-hidden rounded-lg border border-rule bg-paper/90">
>>>>>>> origin/main
            <button
              type="button"
<<<<<<< HEAD
              className="hit min-w-56 shrink-0 snap-start border border-rule bg-control p-3 dark:border-rule-inverse dark:bg-control-inverse"
              aria-pressed={
                selectedEvent?.id === event.id
              }
=======
              aria-label="Zoom in"
              className="grid size-7 cursor-pointer place-items-center font-ui text-base text-ink hover:bg-gold/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:bg-gold/25 disabled:opacity-40"
              disabled={view.zoom >= MAX_ZOOM}
              onClick={() => setView((current) => clampView({ ...current, zoom: current.zoom * 2 }))}
            >
              +
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              className="grid size-7 cursor-pointer place-items-center border-t border-rule font-ui text-base text-ink hover:bg-gold/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:bg-gold/25 disabled:opacity-40"
              disabled={view.zoom <= MIN_ZOOM}
              onClick={() => setView((current) => clampView({ ...current, zoom: current.zoom / 2 }))}
            >
              −
            </button>
            <button
              type="button"
              aria-label="Show the whole map"
              className="grid size-7 cursor-pointer place-items-center border-t border-rule text-ink hover:bg-gold/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:bg-gold/25 disabled:opacity-40"
              disabled={view.zoom <= MIN_ZOOM}
>>>>>>> origin/main
              onClick={() => {
                setSelectedCluster(null);
                handleCloseStory();
                setView({ zoom: MIN_ZOOM, x: 0.5, y: 0.5 });
              }}
            >
              <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="2.2" y="2.2" width="11.6" height="11.6" rx="1.2" />
              </svg>
            </button>
          </div>
        </div>
        </div>
        <p className="quiet mt-2 mb-0 shrink-0">
          {placed.length === 1 ? "1 place" : `${placed.length} places`} on {onWorld} by the end of {year}
        </p>
      </section>

      <section className="surface shrink-0 px-4 py-2" aria-label="Year">
        <YearRail years={years} year={year} onChange={setYear} />
      </section>

      {selectedEvent ? (
        <section ref={storyRef} className="surface grid gap-4 p-4" aria-labelledby="event-story-heading">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">
                {selectedEvent.mission.name}
                {" · "}
                {selectedEvent.eventType}
              </p>
              <h2 id="event-story-heading" className="m-0 text-2xl font-medium tracking-tight">
                {story?.title ?? selectedEvent.title}
              </h2>
              <p className="quiet mt-2">
                {selectedEvent.occurredOn ? formatDay(selectedEvent.occurredOn) : "Date unpublished"}
                {" · "}
                {selectedEvent.hardware ? (
                  <Link href={`/hardware/${selectedEvent.hardware.id}`}>{selectedEvent.hardware.name}</Link>
                ) : (
                  "Mission-level event"
                )}
              </p>
            </div>
            <button
              type="button"
              className="hit rounded-lg border border-rule px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold dark:border-rule-inverse"
              onClick={handleCloseStory}
            >
              Close
            </button>
          </div>

<<<<<<< HEAD
          {storyLoading && (
            <div role="status" aria-live="polite" className="grid gap-3">
              <p className="quiet m-0">Creating your space story...</p>
              <div className="animate-pulse space-y-2">
                <div className="h-4 w-2/3 rounded bg-paper2 dark:bg-paper2-inverse" />
                <div className="h-4 w-full rounded bg-paper2 dark:bg-paper2-inverse" />
                <div className="h-4 w-11/12 rounded bg-paper2 dark:bg-paper2-inverse" />
                <div className="h-4 w-4/5 rounded bg-paper2 dark:bg-paper2-inverse" />
              </div>
            </div>
          )}
=======
          {storyLoading ? (
            <p role="status" aria-live="polite" className="quiet">
              Creating your space story...
            </p>
          ) : null}
>>>>>>> origin/main

          {storyError ? (
            <div role="alert" className="grid gap-2">
              <p className="m-0">{storyError}</p>
              <button
                type="button"
                className="hit w-fit rounded-lg border border-rule px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold dark:border-rule-inverse"
                onClick={handleRetryStory}
              >
                Try again
              </button>
            </div>
          ) : null}

          {story && !storyLoading ? (
            <div className="grid gap-4">
              <p className="text-base leading-relaxed">{story.opening}</p>
              {story.chapters.map((chapter, index) => (
                <article
                  key={`${index}-${chapter.title}`}
                  className="grid gap-2 border-t border-rule pt-4 dark:border-rule-inverse"
                >
                  <h3 className="m-0 text-lg font-medium">{chapter.title}</h3>
                  <p className="m-0 leading-relaxed">{chapter.content}</p>
                </article>
              ))}
              <div className="rounded-xl bg-paper2 p-3 dark:bg-paper2-inverse">
                <p className="eyebrow">What we learned</p>
                <p className="m-0 leading-relaxed">{story.takeaway}</p>
              </div>
            </div>
          ) : null}

          {selectedEvent.citations.length > 0 ? (
            <div className="grid gap-2 border-t border-rule pt-3 dark:border-rule-inverse">
              <p className="eyebrow">NASA sources</p>
              {selectedEvent.citations.map((citation) => (
                <a
                  key={citation.sourceId}
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  {citation.title} · {citation.publisher}
                </a>
              ))}
            </div>
          ) : null}
        </section>
<<<<<<< HEAD
      )}

      {/* Hardware ledger */}
      <section
        className="surface col-span-full grid gap-3 p-4"
        aria-labelledby="ledger-title"
      >
        <div>
          <h2
            id="ledger-title"
            className="m-0 text-2xl font-medium tracking-tight"
          >
            Ledger
          </h2>

          <p className="quiet m-0 mt-2">
            Dim rows arrived outside{" "}
            {startYear === endYear
              ? startYear
              : `${startYear}–${endYear}`}
            .
          </p>
          <p className="quiet m-0">
            Sorted by{" "}
            {SORT_OPTIONS.find(
              (option) => option.id === sort,
            )?.label.toLowerCase() ?? "name"}
            .
          </p>
        </div>

        {sortedFiltered.length === 0 ? (
          <p className="m-0">
            No records match this filter set. Reset filters to see the full archive.
          </p>
        ) : null}

        <ul className="m-0 grid list-none gap-1 p-0">
          {sortedFiltered.map((item) => {
            const outside =
              item.arrivedOn !== null &&
              (item.arrivedOn < from ||
                item.arrivedOn > through);

            return (
              <li key={item.id}>
                <Link
                  href={`/hardware/${item.id}`}
                  className="grid grid-cols-1 gap-1 rounded-lg px-1 py-2 no-underline hover:bg-gold/10 focus-visible:bg-gold/10 active:bg-gold/20 sm:grid-cols-[minmax(0,1.4fr)_minmax(8rem,0.6fr)_auto] sm:items-baseline sm:gap-3 data-[outside=true]:opacity-45 dark:hover:bg-gold-inverse/10 dark:focus-visible:bg-gold-inverse/10 dark:active:bg-gold-inverse/20"
                  data-outside={outside}
                >
                  <span>{item.name}</span>

                  <span className="quiet">
                    {item.mission.name}
                  </span>

                  <span className="quiet">
                    {item.pin
                      ? item.pin.specificity === "site"
                        ? "Site pin"
                        : "Own pin"
                      : "No pin"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
=======
      ) : null}
>>>>>>> origin/main
    </div>
  );
}
