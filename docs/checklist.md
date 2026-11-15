# Celestial Archives checklist

The prototype is the Moon archive you can demo this weekend. The complete project is the same archive extended to Mars, asteroids, and deep space, told as a story for school-age readers.

Most of the prototype spine is already in the repo: sourced lunar seed, read-only API, equirectangular map, timeline, mission and hardware pages, and credits.

Frontend and backend are two people. Open prototype work is marked **FE** or **BE**. Items that cannot move until the other side ships something are in [Blockers](#blockers).

## Prototype — Moon map and timeline

### Data and API

- [x] Schema for bodies, missions, hardware, locations, events, facts, and citations
- [x] NASA-only lunar seed: Rangers, Surveyors, Lunar Orbiters, Apollo hardware, and later impacts
- [x] Coordinates copied from NASA pages; missing ones left blank
- [x] Conflicting coordinates stored as separate claims, with the LROC-imaged claim used as the pin
- [x] `GET /api/missions`, `/api/missions/[slug]`, `/api/hardware`, `/api/hardware/[slug]`, `/api/timeline`
- [ ] **BE** — Confirm every summary, date, and coordinate still matches its cited NASA page
- [ ] **FE** — Name at least one dataset from the challenge Resources tab on the credits page, and show that the app actually uses it

### Screens

- [x] 2D Moon map. Pins that overlap on screen share one bubble, with the count inside and a donut when the group mixes types. Clicking a bubble zooms until it splits; a site that stays together opens its list
- [x] Timeline that hides hardware not yet on the Moon, with play and scrub
- [x] Filters for mission, type, and search
- [x] Hardware record: preferred location, other claims, facts, events, parent and children, citations
- [x] Mission list and mission page
- [x] Credits page with sources and a Super Intelligence (SI) note
- [x] **FE** — Lunar basemap under the pins: NASA SVS LROC color mosaic (`public/maps/moon.jpg`, 0° longitude at center). Mars uses the ESA HRSC colour mosaic (`public/maps/mars.jpg`, same frame)
- [ ] **FE** — Add a short school-age story on each record: what the object was, and the science it made possible. Blocked on a story field; see [Blockers](#blockers)
- [ ] **FE** — Add one guided path through a few objects (for example Eagle, Surveyor 3, a rover) so a judge can follow a story instead of only a catalog
- [ ] **FE** — Keep filter and selected pin in the URL so a demo link opens on the right place. `mission` and `type` are read once from the query string; search and the selected pin are not stored, and changing a filter does not update the URL

### Ship it

- [ ] **BE** — Run the seed against Neon, then deploy to Vercel. The site stays on “archive is not loaded” until that seed has run
- [ ] **FE** — Check the map, timeline, a hardware page, and a mission page on a phone and on a desktop
- [ ] Record a demo of 30 seconds or fewer, or a deck of at most 7 slides
- [ ] Submit title, summary, demo link, project link, description, NASA sources, and how Super Intelligence (SI) was used

## Blockers

Pages and the API share `types/archive.ts`. Rename a field in both places, or the map and the routes drift apart.

| Blocker | Waiting on | Until then |
| --- | --- | --- |
| School-age story on each record | **BE** — `summary` is the only prose field. Add a story on hardware and mission detail | **FE** has nothing to render except the existing summary |
| Small body or deep space | **BE** — the seed inserts `moon` and `mars` only | **FE** switcher already lists those two. `?body=` 404s anything else |
| Deployed demo | **BE** — `npm run db:seed` with the deployment’s `DATABASE_URL` | **FE** can verify localhost, not the public URL |
| Admin screen to review a claim | **BE** — the API is read-only. Not required for the prototype | **FE** cannot build the review screen |

Not blocked:

- A guided path can be a hardcoded list of slugs the catalog already has. A path stored in the database needs a new payload first.
- The phone check and URL state (`q`, selected pin, writing filters back to the query string) are frontend-only. The Moon basemap is in place. Pins and `arrivedOn` are already on each hardware item. `GET /api/hardware` already accepts `mission`, `type`, and `q`.
- Fact-checking the catalog is a backend edit in `app/lib/seed/catalog.ts`, then `npm run db:seed`.
- The credits dataset line is frontend copy. Add a source row only if that dataset should appear in the source list.

## Complete project

### More worlds

- [x] Mars: Pathfinder and Sojourner, Spirit, Opportunity, Viking 1 and 2, Phoenix, InSight, Ingenuity
- [ ] Small bodies: Dawn at Ceres, NEAR Shoemaker on Eros
- [ ] Deep space with no surface pin: Pioneer 10 and 11, Kepler
- [x] A body switcher on the map and in the API (`?body=moon` or `?body=mars`)
- [ ] Same citation rule: NASA sources only, no guessed coordinates

### Story

- [ ] A reading level and length aimed at school-age readers on every record
- [ ] A path per world: Moon landings, Mars landers and rovers, probes that never came home
- [ ] Photos from NASA, credited; any Super Intelligence (SI) image or video watermarked and free of NASA logos

### Map and archive

- [ ] 3D globe (Cesium or Three.js) after the 2D maps are solid
- [ ] Terrain and elevation where a NASA source gives them
- [ ] PostGIS only if a query needs it (nearby objects, uncertainty circles)
- [ ] Pagination on list endpoints once Mars and deep space are loaded. Agree the query params before either side builds it
- [ ] Write and verify API, plus a small admin screen to review a claim before it becomes the preferred pin
- [ ] PDS, Orbital Data Explorer, and USGS Astrogeology added as sources where they add a coordinate or a date the NSSDCA page does not

### Still out until you decide otherwise

- Commercial CLPS landers and non-NASA hardware
