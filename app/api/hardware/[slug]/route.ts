import { loadHardware } from "@/app/lib/archive/load";
import { jsonData, jsonError, withArchive } from "@/app/lib/api/http";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  return withArchive(async () => {
    const hardware = await loadHardware(slug);
    if (!hardware) return jsonError(404, "hardware_not_found", "No hardware record has that id.");
    return jsonData(hardware);
  });
}
