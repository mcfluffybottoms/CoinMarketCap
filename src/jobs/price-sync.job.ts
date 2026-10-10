import { SyncError } from '../errors/errors';
import { CryptoService } from '../services/crypto.service';
import { PriceService } from '../services/price.service';
import { logger } from '../utils/logger';

export class PriceSyncJob {
    private timer: ReturnType<typeof setInterval> | undefined;
    private isRunning = false;

    constructor(
        private readonly priceService: PriceService,
        private readonly cryptoService: CryptoService,
        private readonly intervalMs: number,
    ) {
        if (intervalMs <= 0) {
            throw new SyncError('Sync interval must be a positive number');
        }
    }

    private async runOnce(): Promise<void> {
        if (this.isRunning) return;

        this.isRunning = true;
        try {
            const cryptocurrencies = await this.cryptoService.findAll();
            await this.priceService.refreshPrices(cryptocurrencies.map((coin) => coin.id));
        } catch (error) {
            logger.error(
                `Price sync job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        } finally {
            this.isRunning = false;
        }
    }

    async start() {
        if (this.timer) return;

        void this.runOnce();

        this.timer = setInterval(() => {
            void this.runOnce();
        }, this.intervalMs);
    }

    async stop(): Promise<void> {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }

        while (this.isRunning) {
            await new Promise<void>((resolve) => setTimeout(resolve, 50));
        }
    }
}
