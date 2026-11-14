# Backend

Read-only archive. Drizzle talks to Postgres. With `DATABASE_URL` unset, that database is a PGlite file in `.data/pglite`. With `DATABASE_URL` set, it is Neon (or any Postgres URL). Migrations in `drizzle/` run on the first connection.

Pages do not fetch these routes. They call `loadArchive`, `loadHardware`, and `loadMission`, which return the same objects as the API `data` field. Shared types are in `types/archive.ts`. Change a field in both places together.

## Where things live

| Path | Role |
| --- | --- |
| `app/lib/db/schema.ts` | Tables |
| `drizzle/` | Generated migrations |
| `app/lib/seed/catalog.ts` | Lunar catalog. Edit records here |
| `app/lib/seed/run.ts` | Validates the catalog, wipes the database, inserts it |
| `app/lib/archive/assemble.ts` | Pins, labels, and the Moon snapshot |
| `app/api/` | HTTP routes |
| `types/archive.ts` | Shapes the UI and the API share |

`npm run db:seed` replaces all rows. `npm run db:generate` writes a migration after a schema change. Apply it by starting the app or running the seed, both of which migrate on connect.

## Response envelope

```json
{ "data": {}, "error": null }
```

```json
{ "data": null, "error": { "code": "hardware_not_found", "message": "No hardware record has that id." } }
```

| Status | Code | When |
| --- | --- | --- |
| 400 | `invalid_query` | A query value is empty or not a string |
| 404 | `body_not_found`, `mission_not_found`, `type_not_found`, `hardware_not_found` | Unknown id |
| 503 | `database_empty` | Tables are missing. Run `npm run db:seed` |
| 500 | `archive_error` | Any other read failure |

## Routes

`GET /api/missions` → `{ body, items, total }`. Each item is a mission summary plus `hardwareCount` and `pinnedCount`.

`GET /api/missions/[slug]` → that mission plus its `hardware` list.

`GET /api/hardware?mission=&type=&q=&body=` → `{ items, total }`. `mission` and `type` are ids. `q` matches name, summary, mission name, or type name. `body` must be `moon` today.

`GET /api/hardware/[slug]` → one record: preferred and other location claims, facts, events, parent, children, citations.

`GET /api/timeline` → `{ items, total }`, events sorted by date. Mission-level events have `hardware: null`.

Ids are slugs (`apollo-11`, `apollo-11-descent-stage`), not numbers.

## What the map uses

Each hardware item has `pin` or `null`, and `arrivedOn` or `null`.

- The pin is the preferred location when that claim is an object coordinate.
- If the object has no object coordinate, the pin is inherited from the nearest parent that does. `specificity` is then `"site"` and `inheritedFrom` names that parent.
- Other claims stay on the detail `locations` array. Only one claim per object has `isPreferred: true`.
- `arrivedOn` is the earliest event with `placesOnSurface` and a day. The timeline hides the object until that date.
- Display labels (`restingLabel`, `conditionLabel`, `methodLabel`, `specificityLabel`) are already on the payload.

The assembler only publishes the body `moon`. Another world needs a seed row and a change in `assembleArchive` before the list routes will return it.

## Seed rules

The catalog must have exactly one preferred location per hardware record. An object-level location needs a latitude and longitude in range. A `placesOnSurface` event needs a day. Every citation must name a source in the catalog. A child must share its parent’s mission. Summary citations are stored as `mission:<id>` and `hardware:<id>`.

Allowed values: resting state `on_surface | impacted | unknown`; condition `inactive | partial | passive | unknown`; location method `lroc_imaged | seismic_estimate | literature | mission_report | catalogue | unknown`; event type `launch | landing | impact | deployment | liftoff | jettison | last_contact | shutdown`.
