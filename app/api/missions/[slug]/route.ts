import { loadMission } from "@/app/lib/archive/load";
import { jsonData, jsonError, withArchive } from "@/app/lib/api/http";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  return withArchive(async () => {
    const mission = await loadMission(slug);
    if (!mission) return jsonError(404, "mission_not_found", "No mission has that id.");
    return jsonData(mission);
  });
}
