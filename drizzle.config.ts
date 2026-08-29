import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: {
    host: process.env.SQL_HOST || 'localhost',
    user: process.env.SQL_ADMIN_USER || process.env.SQL_USER || 'postgres',
    password: process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || '',
    database: process.env.SQL_DB_NAME || 'parque_db',
    ssl: false,
  },
  verbose: true,
});
