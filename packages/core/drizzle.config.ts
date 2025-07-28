import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/data/schema.ts',
  out: './src/data/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: '../../data/business-ideas.db'
  }
});