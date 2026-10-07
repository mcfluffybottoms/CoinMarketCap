import fs from 'node:fs';
import path from 'node:path';

export const testConfig = {
    port: process.env.PORT || 3000,
    databasePath: process.env.DATABASE_PATH ?? path.resolve(process.cwd(), 'data/test.db'),
    migrationsPath: process.env.MIGRATIONS_PATH ?? path.resolve(__dirname, '../src/db/migrations'),
};
