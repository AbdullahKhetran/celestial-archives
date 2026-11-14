import { Suspense } from "react";
import Link from "next/link";
import Citations from "@/app/components/citations";
import { loadArchive } from "@/app/lib/archive/load";

async function MissionIndex() {
  const archive = await loadArchive();
  return (
    <section className="surface grid gap-4 p-4 sm:p-5">
      <div>
        <p className="eyebrow">Moon</p>
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
    </section>
  );
}

export default function MissionsPage() {
  return (
    <Suspense fallback={<p className="quiet">Opening missions…</p>}>
      <MissionIndex />
    </Suspense>
  );
}
