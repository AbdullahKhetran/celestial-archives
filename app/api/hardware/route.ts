import { DEFAULT_BODY_ID } from "@/constants/bodies";
import { filterHardware } from "@/app/lib/archive/filter";
import { loadBody } from "@/app/lib/archive/load";
import { jsonData, jsonError, queryMessage, readQuery, withArchive } from "@/app/lib/api/http";

export async function GET(request: Request) {
  const parsed = readQuery(request);
  if (!parsed.success) return jsonError(400, "invalid_query", queryMessage(parsed.error));

  return withArchive(async () => {
    const { mission, type, q, body } = parsed.data;
    const archive = await loadBody(body ?? DEFAULT_BODY_ID);
    if (!archive) {
      return jsonError(404, "body_not_found", "That celestial body is not in the archive.");
    }
    if (mission && !archive.missions.some((item) => item.id === mission)) {
      return jsonError(404, "mission_not_found", "No mission has that id.");
    }
    if (type && !archive.types.some((item) => item.id === type)) {
      return jsonError(404, "type_not_found", "No hardware type has that id.");
    }
    const items = filterHardware(archive.hardware, { mission, type, q });
    return jsonData({ body: archive.body, items, total: items.length });
  });
}
