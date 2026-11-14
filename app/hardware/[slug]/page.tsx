import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Citations from "@/app/components/citations";
import { formatCoordinate, formatDay } from "@/app/lib/archive/geo";
import { loadHardware } from "@/app/lib/archive/load";

type HardwarePageProps = {
  params: Promise<{ slug: string }>;
};

async function HardwareRecord({ params }: HardwarePageProps) {
  const { slug } = await params;
  const hardware = await loadHardware(slug);
  if (!hardware) notFound();
  const preferred = hardware.locations.find((location) => location.isPreferred);

  return (
    <article className="surface grid gap-4 p-4 sm:p-5">
      <div>
        <p className="eyebrow">
          <Link href={`/?mission=${hardware.mission.id}`}>{hardware.mission.name}</Link>
        </p>
        <h2 className="m-0 text-2xl font-medium tracking-tight">{hardware.name}</h2>
      </div>
      <p className="m-0">{hardware.summary}</p>
      <Citations items={hardware.summaryCitations} />
      <p className="m-0 flex flex-wrap gap-2">
        <span className="tag">{hardware.type.name}</span>
        <span className="tag">{hardware.restingLabel}</span>
        <span className="tag">{hardware.conditionLabel}</span>
        {hardware.nssdcaId ? <span className="tag">NSSDCA {hardware.nssdcaId}</span> : null}
      </p>

      <section className="grid gap-2" aria-labelledby="resting-title">
        <h3 id="resting-title" className="m-0 text-lg font-medium">
          Where it rests
        </h3>
        {preferred?.regionName ? <p className="m-0">{preferred.regionName}</p> : null}
        {hardware.pin ? (
          <p className="m-0">
            {hardware.pin.specificity === "site" && hardware.pin.inheritedFrom
              ? `No coordinate of its own. The map uses ${hardware.pin.inheritedFrom.name} at `
              : "Map pin: "}
            {formatCoordinate(hardware.pin.latitudeDeg, hardware.pin.longitudeDeg)}.
          </p>
        ) : (
          <p className="m-0">NASA has not published a coordinate, so this record has no map pin.</p>
        )}
        <ul className="m-0 grid list-none gap-3 p-0">
          {hardware.locations.map((location) => (
            <li key={`${location.method}-${location.latitudeDeg}-${location.note}`} className="grid gap-1">
              <strong>
                {location.isPreferred ? "Preferred claim" : "Other published claim"} · {location.methodLabel}
              </strong>
              <span>
                {location.latitudeDeg !== null && location.longitudeDeg !== null
                  ? formatCoordinate(location.latitudeDeg, location.longitudeDeg)
                  : "No numbers published"}
                {location.uncertaintyM !== null ? ` · uncertainty about ${location.uncertaintyM} m` : ""}
                {location.elevationM !== null ? ` · elevation ${location.elevationM} m` : ""}
              </span>
              {location.referenceFrame ? <span className="quiet">{location.referenceFrame}</span> : null}
              {location.note ? <span>{location.note}</span> : null}
              <Citations items={location.citations} />
            </li>
          ))}
        </ul>
      </section>

      {hardware.facts.length > 0 ? (
        <section className="grid gap-2" aria-labelledby="facts-title">
          <h3 id="facts-title" className="m-0 text-lg font-medium">
            Facts
          </h3>
          <ul className="m-0 grid list-none gap-3 p-0">
            {hardware.facts.map((fact) => (
              <li key={fact.id} className="grid gap-1">
                <strong>{fact.label}</strong>
                <span>{fact.value}</span>
                <Citations items={fact.citations} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-2" aria-labelledby="events-title">
        <h3 id="events-title" className="m-0 text-lg font-medium">
          Events
        </h3>
        <ul className="m-0 grid list-none gap-3 p-0">
          {hardware.events.map((event) => (
            <li key={event.id} className="grid gap-1">
              <strong>
                {event.occurredOn ? formatDay(event.occurredOn) : "Date unpublished"} · {event.title}
              </strong>
              <span>{event.summary}</span>
              <Citations items={event.citations} />
            </li>
          ))}
        </ul>
      </section>

      {hardware.children.length > 0 ? (
        <section className="grid gap-2" aria-labelledby="parts-title">
          <h3 id="parts-title" className="m-0 text-lg font-medium">
            Parts of this record
          </h3>
          <ul className="m-0 grid list-none gap-3 p-0">
            {hardware.children.map((child) => (
              <li key={child.id} className="grid gap-1">
                <Link href={`/hardware/${child.id}`}>
                  {child.name} · {child.typeName}
                </Link>
                <span className="quiet">
                  {child.pin?.specificity === "object"
                    ? "Own coordinate"
                    : child.pin
                      ? "Shown on the station pin"
                      : "No pin"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

export default function HardwarePage({ params }: HardwarePageProps) {
  return (
    <Suspense fallback={<p className="quiet">Opening the record…</p>}>
      <HardwareRecord params={params} />
    </Suspense>
  );
}
