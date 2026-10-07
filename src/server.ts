import { createApp } from './app';
import { config } from './config/env';
import { getDatabase, runMigrations } from './db/database';
import { logger } from './utils/logger';

const PORT = config.port;

export async function createServer(configOverride: Partial<typeof config> = {}) {
    const databaseConfig = {
        ...config,
        ...configOverride,
    };

    const db = await getDatabase(databaseConfig.databasePath);
    await runMigrations(db, databaseConfig.migrationsPath);
    const app = await createApp(db, databaseConfig);
    const port = databaseConfig.port;
    return { app, db, port };
}

export async function startServer(configOverride: Partial<typeof config> = {}) {
    try {
        const { app, db, port } = await createServer(configOverride);
        const server = app.listen(port, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
        return {
            app,
            server,
            db,
        };
    } catch (error) {
        console.error('Error starting the server:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}
