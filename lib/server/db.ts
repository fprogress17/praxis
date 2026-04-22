import { Pool, type QueryResultRow } from "pg";

declare global {
  var __praxisPgPool: Pool | undefined;
}

function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured. Check .env.local.");
  }
  return url;
}

function createPool() {
  return new Pool({
    connectionString: databaseUrl(),
  });
}

export function dbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function db() {
  if (!global.__praxisPgPool) {
    global.__praxisPgPool = createPool();
  }
  return global.__praxisPgPool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  return db().query<T>(text, params);
}
