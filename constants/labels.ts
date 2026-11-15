export const methodLabels: Record<string, string> = {
  lroc_imaged: "LROC image",
  seismic_estimate: "Seismic estimate",
  literature: "Published estimate",
  mission_report: "Mission report",
  catalogue: "2012 catalogue",
  unknown: "Unpublished",
};

export const specificityLabels: Record<string, string> = {
  object: "This object's coordinate",
  site: "Station site",
  unknown: "No published coordinate",
};

export const restingLabels: Record<string, string> = {
  on_surface: "On the surface",
  impacted: "Impact site",
  unknown: "Resting place unknown",
};

export const conditionLabels: Record<string, string> = {
  inactive: "Inactive",
  partial: "Parts removed",
  passive: "Needs no power",
  unknown: "Condition unknown",
};

/** Plain names for the event types stored on `events.event_type`. */
export const eventTypeLabels: Record<string, string> = {
  launch: "Launch",
  landing: "Landing",
  impact: "Impact",
  deployment: "Deployment",
  liftoff: "Liftoff from the surface",
  jettison: "Jettison",
  last_contact: "Last contact",
  shutdown: "Shutdown",
};
