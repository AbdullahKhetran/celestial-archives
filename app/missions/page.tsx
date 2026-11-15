import { Suspense } from "react";
import Link from "next/link";
import { BodyTabs } from "@/app/components/body-tabs";
import Citations from "@/app/components/citations";
import { DEFAULT_BODY_ID } from "@/constants/bodies";
import { loadBody } from "@/app/lib/archive/load";
import type { ArchiveSnapshot } from "@/types/archive";

type MissionsProps = {
  searchParams: Promise<{ body?: string }>;
};

async function MissionIndex({ searchParams }: MissionsProps) {
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
        <h2 className="m-0 text-2xl font-medium tracking-tight">Missions are not loaded</h2>
        <p className="m-0">{message}</p>
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <BodyTabs bodyId={archive.body.id} basePath="/missions" />
      <div className="surface grid gap-4 p-4 sm:p-5">
      <div>
        <p className="eyebrow">{archive.body.name}</p>
        <h2 className="m-0 text-2xl font-medium tracking-tight">Missions that left hardware</h2>
      </div>
      <ul className="m-0 grid list-none gap-4 p-0">
        {archive.missions.map((mission) => (
          <li key={mission.id} className="grid gap-1">
            <Link href={`/missions/${mission.id}`}>
              <strong>{mission.name}</strong>
            </Link>
            <span>{mission.summary}</span>
            <span className="quiet">
              {mission.hardwareCount} records · {mission.pinnedCount} with a map pin
            </span>
            <Citations items={mission.summaryCitations} />
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}

export default function MissionsPage({ searchParams }: MissionsProps) {
  return (
    <Suspense fallback={<p className="quiet">Opening missions…</p>}>
      <MissionIndex searchParams={searchParams} />
    </Suspense>
  );
}
