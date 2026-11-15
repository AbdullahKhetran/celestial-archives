import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Citations from "@/app/components/citations";
import { loadMission } from "@/app/lib/archive/load";

type MissionPageProps = {
  params: Promise<{ slug: string }>;
};

async function MissionRecord({ params }: MissionPageProps) {
  const { slug } = await params;
  const mission = await loadMission(slug);
  if (!mission) notFound();

  return (
    <article className="surface grid gap-4 p-4 sm:p-5">
      <div>
        <p className="eyebrow">
          <Link href={mission.body.id === "moon" ? "/" : `/?body=${mission.body.id}`}>{mission.body.name}</Link>
        </p>
        <h2 className="m-0 text-2xl font-medium tracking-tight">{mission.name}</h2>
      </div>
      <p className="m-0">{mission.summary}</p>
      <Citations items={mission.summaryCitations} />
      <p className="m-0">
        <Link href={mission.body.id === "moon" ? `/?mission=${mission.id}` : `/?body=${mission.body.id}&mission=${mission.id}`}>
          Show this mission on the map
        </Link>
      </p>
      <ul className="m-0 grid list-none gap-3 p-0">
        {mission.hardware.map((item) => (
          <li key={item.id} className="grid gap-1">
            <Link href={`/hardware/${item.id}`}>
              <strong>{item.name}</strong>
            </Link>
            <span className="quiet">
              {item.type.name} · {item.pin ? (item.pin.specificity === "site" ? "Site pin" : "Own pin") : "No pin"}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function MissionPage({ params }: MissionPageProps) {
  return (
    <Suspense fallback={<p className="quiet">Opening the mission…</p>}>
      <MissionRecord params={params} />
    </Suspense>
  );
}
