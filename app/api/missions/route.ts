import { DEFAULT_BODY_ID } from "@/constants/bodies";
import { loadBody } from "@/app/lib/archive/load";
import { jsonData, jsonError, queryMessage, readQuery, withArchive } from "@/app/lib/api/http";

export async function GET(request: Request) {
  const parsed = readQuery(request);
  if (!parsed.success) return jsonError(400, "invalid_query", queryMessage(parsed.error));

  return withArchive(async () => {
    const archive = await loadBody(parsed.data.body ?? DEFAULT_BODY_ID);
    if (!archive) return jsonError(404, "body_not_found", "That celestial body is not in the archive.");
    return jsonData({ body: archive.body, items: archive.missions, total: archive.missions.length });
  });
}
