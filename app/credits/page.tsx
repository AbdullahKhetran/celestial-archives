import { Suspense } from "react";
import { loadRows } from "@/app/lib/archive/load";

const BASEMAP_CREDITS = [
  {
    title: "LROC color mosaic",
    url: "https://svs.gsfc.nasa.gov/4720/",
    publisher: "NASA Scientific Visualization Studio",
  },
  {
    title: "Lunar Reconnaissance Orbiter archive",
    url: "https://pds-geosciences.wustl.edu/missions/lro/",
    publisher: "PDS Geosciences Node",
  },
  {
    title: "HRSC colour mosaic",
    url: "https://hrscteam.dlr.de/public/data/globalcolor.php",
    publisher: "ESA, DLR, and Freie Universität Berlin",
  },
  {
    title: "Mars HRSC high-altitude mosaic",
    url: "https://doi.org/10.57780/esa-t4y39mj",
    publisher: "ESA",
  },
] as const;

async function CreditList() {
  const rows = await loadRows();
  return (
    <article className="surface grid flex-1 content-start gap-4 p-4 sm:p-5">
      <div>
        <p className="eyebrow">How this archive was made</p>
        <h2 className="m-0 text-2xl font-medium tracking-tight">Sources</h2>
      </div>
      <p className="m-0">
        Coordinates, dates, and instrument lists were copied from the NASA pages below. When two NASA numbers
        disagree, both are kept. On the Moon the map uses the LROC-imaged claim. On Mars it uses the surveyed
        mission coordinate. Missing coordinates were left blank.
      </p>
      <ul className="m-0 grid list-none gap-3 p-0">
        {rows.sources.map((source) => (
          <li key={source.id} className="grid gap-1">
            <a href={source.url} rel="noreferrer">
              <strong>{source.title}</strong>
            </a>
            <span className="quiet">{source.publisher}</span>
          </li>
        ))}
      </ul>
      <h2 className="m-0 text-2xl font-medium tracking-tight">Base map</h2>
      <ul className="m-0 grid list-none gap-3 p-0">
        {BASEMAP_CREDITS.map((source) => (
          <li key={source.url} className="grid gap-1">
            <a href={source.url} rel="noreferrer">
              <strong>{source.title}</strong>
            </a>
            <span className="quiet">{source.publisher}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function CreditsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Suspense fallback={<p className="quiet">Opening credits…</p>}>
        <CreditList />
      </Suspense>
    </div>
  );
}
