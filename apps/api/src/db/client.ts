import { neonConfig, Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

import * as schema from './schema.js';

// Load env vars before reading DATABASE_URL — this module executes
// at import time, before the main entry point's dotenv.config() call.
dotenv.config({ path: '../../.env' });

// WebSocket polyfill — must be set before any Pool is created
neonConfig.webSocketConstructor = ws;

const connectionString = process.env['DATABASE_URL'];

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Provide a Neon Postgres connection string.');
}

const pool = new Pool({ connectionString });

export const db = drizzle({ client: pool, schema });

/**
 * Health check: runs a simple query to verify DB connectivity.
 * Returns latency in ms or throws on failure.
 */
export async function checkDbHealth(): Promise<number> {
  const start = performance.now();
  await pool.query('SELECT 1');
  return Math.round(performance.now() - start);
}

/**
 * Graceful shutdown: drain the connection pool.
 * Call this in SIGTERM/SIGINT handlers.
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
