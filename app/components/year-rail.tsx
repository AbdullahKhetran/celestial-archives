"use client";

type YearRailProps = {
  years: number[];
  year: number;
  onChange: (year: number) => void;
};

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 text-gold" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
    </svg>
  );
}

/**
 * One year for the map. Hardware that arrived through the end of that year stays visible.
 */
export function YearRail({ years, year, onChange }: YearRailProps) {
  const first = years[0] ?? year;
  const last = years[years.length - 1] ?? year;
  const span = Math.max(last - first, 1);
  const fill = ((year - first) / span) * 100;

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <p className="m-0 flex shrink-0 items-center gap-2 font-ui text-sm">
        <CalendarIcon />
        <span>Till Year</span>
      </p>
      <label className="sr-only" htmlFor="archive-year">
        Show hardware that had arrived by this year
      </label>
      <input
        id="archive-year"
        className="year-slider min-w-0 flex-1"
        type="range"
        min={first}
        max={last}
        step={1}
        value={year}
        style={{ ["--fill" as string]: `${fill}%` }}
        aria-valuemin={first}
        aria-valuemax={last}
        aria-valuenow={year}
        aria-valuetext={`Through ${year}`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="shrink-0 font-ui text-sm text-muted tabular-nums">{last}</span>
    </div>
  );
}
