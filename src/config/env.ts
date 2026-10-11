import fs from 'node:fs';
import path from 'node:path';

function readSecret(fileEnv: string, directEnv: string): string {
    const filePath = process.env[fileEnv];
    if (filePath) {
        return fs.readFileSync(filePath, 'utf8').trim();
    }
    return process.env[directEnv] ?? '';
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const cmcApiKey = readSecret('CMC_API_KEY_FILE', 'CMC_API_KEY');
export const appApiKey = readSecret('APP_API_KEY_FILE', 'APP_API_KEY');

export const config = {
    port: parsePositiveInt(process.env.PORT, 3000),
    databasePath: process.env.DATABASE_PATH ?? path.resolve(process.cwd(), 'data/crypto.db'),
    migrationsPath: process.env.MIGRATIONS_PATH ?? path.resolve(__dirname, '../db/migrations'),
    environment: process.env.ENVIRONMENT ?? 'development',
    apiKey: appApiKey,
    CMCapiKey: cmcApiKey,
    currency: process.env.CURRENCY ?? 'USD',
    cmcTimeout: parsePositiveInt(process.env.CMC_TIMEOUT, 5000),
    updateTime: parsePositiveInt(process.env.UPDATE_TIME, 30000),
};
