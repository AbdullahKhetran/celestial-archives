import { loadArchive } from "@/app/lib/archive/load";
import { jsonData, withArchive } from "@/app/lib/api/http";

export async function GET() {
  return withArchive(async () => {
    const archive = await loadArchive();
    return jsonData({ body: archive.body, items: archive.missions, total: archive.missions.length });
  });
}
