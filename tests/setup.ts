import fs from 'node:fs';
import path from 'node:path';

export const testConfig = {
    databasePath: path.resolve(process.cwd(), 'data/test.db'),
    migrationsPath: path.resolve(__dirname, '../src/db/migrations'),
    environment: 'test',
    apiKey: 'test-api-key',
};
