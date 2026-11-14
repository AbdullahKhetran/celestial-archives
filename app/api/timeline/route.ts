import { loadArchive } from "@/app/lib/archive/load";
import { jsonData, withArchive } from "@/app/lib/api/http";

export async function GET() {
  return withArchive(async () => {
    const archive = await loadArchive();
    return jsonData({ items: archive.timeline, total: archive.timeline.length });
  });
}
