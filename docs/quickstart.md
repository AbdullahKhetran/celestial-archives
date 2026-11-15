# Local quickstart

Node.js 20 or newer. From the project folder:

```bash
npm install
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Stop the server with Ctrl+C.

Leave `DATABASE_URL` unset. The seed creates a local Postgres database in `.data/pglite` and loads the lunar catalog. That folder is not committed. Running `npm run db:seed` again replaces the local data with `app/lib/seed/catalog.ts`.

If the home page says the archive is not loaded, run `npm run db:seed` and refresh.

## Pages

| Page | What it is |
| --- | --- |
| [http://localhost:3000](http://localhost:3000) | Map, timeline, and ledger |
| [http://localhost:3000/missions](http://localhost:3000/missions) | Missions that left hardware |
| [http://localhost:3000/credits](http://localhost:3000/credits) | NASA sources and the Super Intelligence (SI) note |

A hardware record is `/hardware/[slug]`, for example [http://localhost:3000/hardware/apollo-11-descent-stage](http://localhost:3000/hardware/apollo-11-descent-stage). A mission is `/missions/[slug]`, for example [http://localhost:3000/missions/apollo-11](http://localhost:3000/missions/apollo-11).

`/?mission=apollo-11&type=rover` opens the map with those filters. Search text and the selected pin are not in the URL yet.

## Neon

Copy `.env.example` to `.env`, set `DATABASE_URL`, then run `npm run db:seed` before `npm run dev`. The same seed command wipes and reloads that database.

The read API is documented in [backend](backend.md).
