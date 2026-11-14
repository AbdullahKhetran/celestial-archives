"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";

type Handle = "start" | "end";

type YearRailProps = {
  years: number[];
  startYear: number;
  endYear: number;
  /** Years in which at least one visible record arrived on the Moon. */
  arrivalYears: ReadonlySet<number>;
  onChange: (startYear: number, endYear: number) => void;
};

type Edge = "start" | "end" | undefined;

function indexFromClientX(element: HTMLElement, clientX: number, count: number): number {
  if (count <= 1) return 0;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0) return 0;
  const ratio = (clientX - rect.left) / rect.width;
  return Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1))));
}

function edgeFor(index: number, count: number): Edge {
  if (index <= 0) return "start";
  if (index >= count - 1) return "end";
  return undefined;
}

/**
 * Decade labels, plus the first and last year when they would not collide with a decade.
 * Handle years are labeled on the thumbs, so they are left off this row.
 */
function axisLabels(years: number[]): number[] {
  const first = years[0];
  const last = years[years.length - 1];
  const labels = new Set(years.filter((value) => value % 10 === 0));
  if (labels.size === 0 || first < Math.min(...labels) - 3) labels.add(first);
  if (last > Math.max(...labels) + 3) labels.add(last);
  return [...labels].sort((a, b) => a - b);
}

/**
 * A thumb under the pointer wins. Otherwise the nearer year wins.
 * A tie on a shared year splits on the thumb center, so either handle can still be grabbed.
 */
function handleForPointer(
  target: EventTarget | null,
  clientX: number,
  track: HTMLElement,
  index: number,
  startIndex: number,
  endIndex: number,
  count: number,
): Handle {
  const explicit = target instanceof Element ? target.closest<HTMLElement>("[data-handle]")?.dataset.handle : undefined;
  if (explicit === "start" || explicit === "end") return explicit;
  const startDist = Math.abs(index - startIndex);
  const endDist = Math.abs(index - endIndex);
  if (startDist < endDist) return "start";
  if (endDist < startDist) return "end";
  if (startIndex !== endIndex) return "end";
  const rect = track.getBoundingClientRect();
  const span = Math.max(count - 1, 1);
  const thumbX = rect.left + (startIndex / span) * rect.width;
  return clientX < thumbX ? "start" : "end";
}

/**
 * Start and end years for the archive window.
 * The handles cannot cross, so the map keeps every arrival dated inside the span.
 */
export function YearRail({ years, startYear, endYear, arrivalYears, onChange }: YearRailProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragHandle = useRef<Handle | null>(null);
  const span = Math.max(years.length - 1, 1);
  const startIndex = Math.max(0, years.indexOf(startYear));
  const endIndex = Math.max(startIndex, years.indexOf(endYear));
  const labels = axisLabels(years);
  const crowded = endIndex - startIndex > 0 && endIndex - startIndex <= 8;
  const sameYear = startIndex === endIndex;
  const startPct = (startIndex / span) * 100;
  const endPct = (endIndex / span) * 100;

  function move(handle: Handle, index: number) {
    if (handle === "start") {
      const next = years[Math.min(index, endIndex)];
      if (next !== undefined && next !== startYear) onChange(next, endYear);
      return;
    }
    const next = years[Math.max(index, startIndex)];
    if (next !== undefined && next !== endYear) onChange(startYear, next);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    const index = indexFromClientX(track, event.clientX, years.length);
    const handle = handleForPointer(event.target, event.clientX, track, index, startIndex, endIndex, years.length);
    dragHandle.current = handle;
    event.currentTarget.setPointerCapture(event.pointerId);
    track.querySelector<HTMLElement>(`button[data-handle="${handle}"]`)?.focus();
    move(handle, index);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const handle = dragHandle.current;
    const track = trackRef.current;
    if (!handle || !track || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    move(handle, indexFromClientX(track, event.clientX, years.length));
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    dragHandle.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onKeyDown(handle: Handle, event: KeyboardEvent<HTMLButtonElement>) {
    const index = handle === "start" ? startIndex : endIndex;
    const min = handle === "start" ? 0 : startIndex;
    const max = handle === "start" ? endIndex : years.length - 1;
    const step = event.shiftKey ? 5 : 1;
    let next = index;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = Math.min(max, index + step);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        next = Math.max(min, index - step);
        break;
      case "PageUp":
        next = Math.min(max, index + 10);
        break;
      case "PageDown":
        next = Math.max(min, index - 10);
        break;
      case "Home":
        next = min;
        break;
      case "End":
        next = max;
        break;
      default:
        return;
    }
    event.preventDefault();
    move(handle, next);
  }

  return (
    <div
      className="year-rail"
      role="group"
      aria-label="Year range"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div ref={trackRef} className="year-rail-track">
        <div className="year-rail-fill" style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }} />
        {years.map((value, index) => (
          <span
            key={value}
            className="year-mark"
            data-arrival={arrivalYears.has(value) ? true : undefined}
            data-outside={value < startYear || value > endYear ? true : undefined}
            style={{ left: `${(index / span) * 100}%` }}
          />
        ))}
        <span
          className="year-now"
          style={{ left: `${startPct}%` }}
          aria-hidden="true"
          data-handle={sameYear ? undefined : "start"}
          data-crowd={crowded ? "start" : undefined}
        >
          {startYear}
        </span>
        {sameYear ? null : (
          <span className="year-now" style={{ left: `${endPct}%` }} aria-hidden="true" data-handle="end" data-crowd={crowded ? "end" : undefined}>
            {endYear}
          </span>
        )}
        {labels
          .filter((value) => Math.abs(value - startYear) > 2 && Math.abs(value - endYear) > 2)
          .map((value) => {
            const index = years.indexOf(value);
            const labelEdge = edgeFor(index, years.length);
            return (
              <span
                key={value}
                className={labelEdge ? "year-label" : "year-label hidden sm:block"}
                data-edge={labelEdge}
                style={{ left: `${(index / span) * 100}%` }}
              >
                {value}
              </span>
            );
          })}
        <button
          type="button"
          className="year-thumb"
          data-handle="start"
          data-overlap={sameYear ? "start" : undefined}
          style={{ left: `${startPct}%` }}
          role="slider"
          aria-label="Start year"
          aria-orientation="horizontal"
          aria-valuemin={years[0]}
          aria-valuemax={endYear}
          aria-valuenow={startYear}
          aria-valuetext={`From ${startYear}`}
          onKeyDown={(event) => onKeyDown("start", event)}
        />
        <button
          type="button"
          className="year-thumb"
          data-handle="end"
          data-overlap={sameYear ? "end" : undefined}
          style={{ left: `${endPct}%` }}
          role="slider"
          aria-label="End year"
          aria-orientation="horizontal"
          aria-valuemin={startYear}
          aria-valuemax={years[years.length - 1]}
          aria-valuenow={endYear}
          aria-valuetext={`Through ${endYear}`}
          onKeyDown={(event) => onKeyDown("end", event)}
        />
      </div>
    </div>
  );
}
