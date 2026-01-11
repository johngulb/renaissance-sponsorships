import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import * as schema from './schema';

// Load environment variables from .env.local or .env
config({ path: '.env.local' });
config({ path: '.env' });

// Create Turso client with singleton pattern for Next.js hot reloading
let tursoClient: ReturnType<typeof createClient> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getTursoClient() {
  if (tursoClient) {
    return tursoClient;
  }

  const url = process.env.TURSO_DATABASE_URL || 'file:./dev.sqlite3';
  const authToken = process.env.TURSO_AUTH_TOKEN;

  // For local development, use file-based SQLite if no auth token
  if (authToken) {
    tursoClient = createClient({ url, authToken });
  } else {
    // Local file-based SQLite (for dev)
    const fileUrl = url.startsWith('file:') ? url : `file:${url}`;
    tursoClient = createClient({ url: fileUrl });
  }

  return tursoClient;
}

// Create drizzle instance with singleton pattern
export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const client = getTursoClient();
  dbInstance = drizzle(client, { schema });
  return dbInstance;
}

// Export db for backwards compatibility
export const db = getDb();

export type Database = typeof db;
