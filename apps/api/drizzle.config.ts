import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: '../../.env' });

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    // Use direct (non-pooled) connection for migrations
    url: process.env['DATABASE_URL_DIRECT'] ?? process.env['DATABASE_URL'] ?? '',
  },
});
