import path from 'path';

const parsedPort = Number.parseInt(process.env.PORT ?? '', 10);
const parsedCmcTimeout = Number.parseInt(process.env.CMC_TIMEOUT ?? '', 10);
const parsedUpdateTime = Number.parseInt(process.env.UPDATE_TIME ?? '', 30000);
export const config = {
    port: Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3000,
    databasePath: process.env.DATABASE_PATH ?? path.resolve(process.cwd(), 'data/crypto.db'),
    migrationsPath: process.env.MIGRATIONS_PATH ?? path.resolve(__dirname, '../db/migrations'),
    environment: process.env.ENVIRONMENT ?? 'development',
    apiKey: process.env.APP_API_KEY ?? '',
    CMCapiKey: process.env.CMC_API_KEY ?? '',
    currency: process.env.CURRENCY ?? 'USD',
    cmcTimeout:
        Number.isInteger(parsedCmcTimeout) && parsedCmcTimeout > 0 ? parsedCmcTimeout : 5000,
    updateTime:
        Number.isInteger(parsedUpdateTime) && parsedUpdateTime > 0 ? parsedUpdateTime : 30000,
};
