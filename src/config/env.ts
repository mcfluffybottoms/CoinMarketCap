import path from 'path';

export const config = {
    port: process.env.PORT || 3000,
    databasePath: process.env.DATABASE_PATH ?? path.resolve(process.cwd(), 'data/crypto.db'),
    migrationsPath: process.env.MIGRATIONS_PATH ?? path.resolve(__dirname, '../db/migrations'),
    environment: process.env.ENVIRONMENT ?? 'development',
    apiKey: process.env.APP_API_KEY ?? '',
};
