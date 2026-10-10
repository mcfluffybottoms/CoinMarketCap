import { Server } from 'http';
import { createApp } from './app';
import { CryptoClient } from './clients/client';
import { MockCryptoClient } from './clients/mock-crypto.client';
import { config } from './config/env';
import { closeDatabase, getDatabase, runMigrations } from './db/database';
import { logger } from './utils/logger';
import { ShutdownManager } from './shutdown-manager';
import { CoinMarketCapClient } from './clients/coinmarketcap.client';

const PORT = config.port;

export async function createServer(
    configOverride: Partial<typeof config> = {},
    client: CryptoClient,
) {
    const databaseConfig = {
        ...config,
        ...configOverride,
    };

    const db = await getDatabase(databaseConfig.databasePath);
    try {
        await runMigrations(db, databaseConfig.migrationsPath);
        const { app, sync } = await createApp(db, databaseConfig, client);
        const port = databaseConfig.port;
        return { app, db, port, sync };
    } catch (error) {
        closeDatabase(db);
        throw error;
    }
}

export async function startServer(configOverride: Partial<typeof config> = {}) {
    const databaseConfig = {
        ...config,
        ...configOverride,
    };

    const client = new CoinMarketCapClient(
        databaseConfig.CMCapiKey,
        databaseConfig.currency,
        databaseConfig.cmcTimeout,
    );
    const { app, db, port, sync } = await createServer(configOverride, client);
    let server: Server;
    let shutdown: ShutdownManager;
    try {
        server = app.listen(port, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
        await sync.start();
        shutdown = new ShutdownManager(server, db, sync);
    } catch (error) {
        console.error('Error starting the server:', error);
        process.exit(1);
    }

    return {
        app,
        server,
        db,
        shutdown,
    };
}

if (require.main === module) {
    startServer().catch((error) => {
        logger.error('Failed to start server:', error);
        process.exitCode = 1;
    });
}
