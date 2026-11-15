export function formatCoordinate(latitudeDeg: number, longitudeDeg: number): string {
  const digits = { maximumFractionDigits: 5 };
  const latitude = new Intl.NumberFormat("en-US", digits).format(Math.abs(latitudeDeg));
  const longitude = new Intl.NumberFormat("en-US", digits).format(Math.abs(longitudeDeg));
  return `${latitude}° ${latitudeDeg >= 0 ? "N" : "S"}, ${longitude}° ${longitudeDeg >= 0 ? "E" : "W"}`;
}

export function formatDay(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatMonth(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function monthEnd(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${key}-${String(lastDay).padStart(2, "0")}`;
}

/** Inclusive calendar years. `start` and `end` may be full dates or year strings. */
export function yearsFrom(start: string, end: string): number[] {
  const first = Number(start.slice(0, 4));
  const last = Number(end.slice(0, 4));
  const years: number[] = [];
  for (let year = first; year <= last; year += 1) years.push(year);
  return years;
}

/** First civil day of a year, so a range includes every arrival dated in that year. */
export function yearStart(year: number): string {
  return `${year}-01-01`;
}

/** Last civil day of a year, so a range includes every arrival dated in that year. */
export function yearEnd(year: number): string {
  return `${year}-12-31`;
}

/** Inclusive month keys from start through end, so the timeline can stop on the last event. */
export function monthsFrom(start: string, end: string): string[] {
  const months: string[] = [];
  let year = Number(start.slice(0, 4));
  let month = Number(start.slice(5, 7));
  const endKey = end.slice(0, 7);
  while (`${year}-${String(month).padStart(2, "0")}` <= endKey) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
  }
  return months;
}
