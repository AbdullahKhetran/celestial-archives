import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { Pool } from "pg";
import { DATABASE_URL, MIGRATIONS_FOLDER, PGLITE_DATA_DIR } from "@/constants/database";
import * as schema from "./schema";

export type ArchiveDatabase =
  | PgliteDatabase<typeof schema>
  | NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  archiveDb?: ArchiveDatabase;
  archiveReady?: Promise<void>;
};

function isLocalConnection(connectionString: string) {
  return /localhost|127\.0\.0\.1/.test(connectionString);
}

function createDatabase(): ArchiveDatabase {
  const connectionString = DATABASE_URL;
  if (connectionString) {
    const pool = new Pool({
      connectionString,
      ssl: isLocalConnection(connectionString)
        ? undefined
        : { rejectUnauthorized: false },
    });
    return drizzlePg(pool, { schema });
  }

  const dataDir = path.join(process.cwd(), PGLITE_DATA_DIR);
  fs.mkdirSync(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  return drizzlePglite(client, { schema });
}

export function getDatabase() {
  if (!globalForDb.archiveDb) {
    globalForDb.archiveDb = createDatabase();
  }
  return globalForDb.archiveDb;
}

/** Applies migrations once per process. A failed migration is retried on the next call. */
export async function ensureDatabase() {
  if (!globalForDb.archiveReady) {
    const database = getDatabase();
    const migrationsFolder = path.join(process.cwd(), MIGRATIONS_FOLDER);
    globalForDb.archiveReady = (
      DATABASE_URL
        ? migratePg(database as NodePgDatabase<typeof schema>, { migrationsFolder })
        : migrate(database as PgliteDatabase<typeof schema>, { migrationsFolder })
    ).catch((error: unknown) => {
      globalForDb.archiveReady = undefined;
      throw error;
    });
  }
  await globalForDb.archiveReady;
  return getDatabase();
}

export async function closeDatabase() {
  const database = globalForDb.archiveDb;
  globalForDb.archiveDb = undefined;
  globalForDb.archiveReady = undefined;
  if (!database) return;
  const client = (
    database as { $client?: { end?: () => Promise<void>; close?: () => Promise<void> } }
  ).$client;
  if (!client) return;
  if (client.end) await client.end();
  else if (client.close) await client.close();
}
