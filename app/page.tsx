import { Suspense } from "react";
import ArchiveExplorer from "@/app/components/archive-explorer";
import { DEFAULT_BODY_ID } from "@/constants/bodies";
import { loadBody } from "@/app/lib/archive/load";
import type { ArchiveSnapshot } from "@/types/archive";

type HomeSearch = {
  body?: string;
  mission?: string;
  type?: string;
};

type HomeProps = {
  searchParams: Promise<HomeSearch>;
};

async function ArchiveHome({ searchParams }: HomeProps) {
  const params = await searchParams;
  const requested = params.body?.trim() || DEFAULT_BODY_ID;
  let archive: ArchiveSnapshot | null = null;
  let message = "The archive could not be opened.";
  try {
    archive = await loadBody(requested);
    if (!archive) message = "That celestial body is not in the archive.";
  } catch (error) {
    message = error instanceof Error ? error.message : message;
  }

  if (!archive) {
    return (
      <section className="surface grid gap-3 p-4">
        <div>
          <p className="eyebrow">Database</p>
          <h2 className="m-0 text-2xl font-medium tracking-tight">The archive is not loaded</h2>
        </div>
        <p className="m-0">{message}</p>
        <p className="quiet m-0">From the project folder, run npm run db:seed and refresh this page.</p>
      </section>
    );
  }

  return (
    <ArchiveExplorer
      archive={archive}
      initialMission={params.mission}
      initialType={params.type}
    />
  );
}

export default function Home({ searchParams }: HomeProps) {
  return (
    <Suspense fallback={<p className="quiet">Opening the archive…</p>}>
      <ArchiveHome searchParams={searchParams} />
    </Suspense>
  );
}
