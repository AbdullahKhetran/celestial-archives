import type { HardwareListItem, HardwareQuery } from "@/types/archive";

/** Keeps records that match the mission, type, and free-text query together. */
export function filterHardware(items: HardwareListItem[], query: HardwareQuery): HardwareListItem[] {
  const needle = query.q?.toLowerCase();
  return items.filter((item) => {
    if (query.mission && item.mission.id !== query.mission) return false;
    if (query.type && item.type.id !== query.type) return false;
    if (!needle) return true;
    return (
      item.name.toLowerCase().includes(needle) ||
      item.summary.toLowerCase().includes(needle) ||
      item.mission.name.toLowerCase().includes(needle) ||
      item.type.name.toLowerCase().includes(needle)
    );
  });
}
