import { Suspense } from "react";
import { loadRows } from "@/app/lib/archive/load";

async function CreditList() {
  const rows = await loadRows();
  return (
    <article className="surface grid gap-4 p-4 sm:p-5">
      <div>
        <p className="eyebrow">How this archive was made</p>
        <h2 className="m-0 text-2xl font-medium tracking-tight">Sources</h2>
      </div>
      <p className="m-0">
        Coordinates, dates, and instrument lists were copied from the NASA pages below. When two NASA numbers
        disagree, both are kept and the map uses the LROC-imaged claim. Missing coordinates were left blank.
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
      <h2 className="m-0 text-2xl font-medium tracking-tight">AI</h2>
      <p className="m-0">
        An AI coding assistant drafted the application and the short summaries. The summaries stay inside the facts
        on the cited pages. No AI-generated images are used. Before a challenge submission, confirm that at least one
        dataset from the official challenge Resources tab is named here. NSSDCA is the catalog this archive reads.
      </p>
      <h2 className="m-0 text-2xl font-medium tracking-tight">Editing records</h2>
      <p className="m-0">
        The API is read-only. Change a fact in <code>app/lib/seed/catalog.ts</code>, then run <code>npm run db:seed</code>.
        Set <code>DATABASE_URL</code> to a Neon connection string when you deploy. Without it, the app uses a Postgres
        file in <code>.data/</code>.
      </p>
    </article>
  );
}

export default function CreditsPage() {
  return (
    <Suspense fallback={<p className="quiet">Opening credits…</p>}>
      <CreditList />
    </Suspense>
  );
}
