import { Server } from 'http';
import { config } from './config/env';
import { Database } from 'sqlite3';
import { logger } from './utils/logger';
import { closeDatabase } from './db/database';
import { PriceSyncJob } from './jobs/price-sync.job';

export class ShutdownManager {
    constructor(
        private server: Server,
        private db: Database,
        private bgSync: PriceSyncJob,
        private isShuttingDown = false,
        private SHUTDOWN_TIMEOUT_MS = 15_000,
    ) {
        process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    }

    async gracefulShutdown(signal: string) {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;
        logger.info(`Received ${signal}. Starting graceful shutdown.`);

        const timeout = setTimeout(() => {
            logger.error('Shutdown timed out. Forcing exit.');
            process.exit(1);
        }, this.SHUTDOWN_TIMEOUT_MS);

        try {
            await new Promise<void>((resolve, reject) => {
                this.server.close((err) => {
                    if (err) {
                        return reject(err);
                    } else {
                        logger.info('HTTP server closed.');
                        resolve();
                    }
                });
            });

            if (this.bgSync) {
                await this.bgSync.stop();
            }

            if (this.db) {
                closeDatabase(this.db);
                logger.info('Database connection pool closed.');
            }

            logger.info(`Graceful shutdown complete.`);
            clearTimeout(timeout);
            process.exit(0);
        } catch (error) {
            console.error(
                `Error during graceful shutdown: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            clearTimeout(timeout);
            process.exit(1);
        }
    }
}
