# Celestial Archives

A Moon map and timeline of NASA hardware left on the surface of moon. Coordinates, dates, and instrument lists are copied from NASA pages. When two NASA numbers disagree, both stay in the record and the map uses the LROC-imaged claim. Missing coordinates are left blank.

The weekend prototype is the Moon. The full archive is the same model extended to Mars, small bodies, and deep space, written for school-age readers.

## Start locally

Node.js 20 or newer.

```bash
npm install
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Setup details are in the [quickstart](docs/quickstart.md).

## Docs

- [Local quickstart](docs/quickstart.md) — install, seed, and pages
- [Backend](docs/backend.md) — database, seed, and the read API
- [Checklist](docs/checklist.md) — prototype, later scope, and blockers between frontend and backend
