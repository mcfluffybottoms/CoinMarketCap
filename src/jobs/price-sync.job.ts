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
    ) {}

    private async runOnce(): Promise<void> {
        if (this.isRunning) return;

        this.isRunning = true;
        try {
            const cryptocurrencies = await this.cryptoService.findAll();
            this.priceService.refreshPrices(cryptocurrencies);
        } catch (error) {
            logger.error(
                `Price sync job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        } finally {
            this.isRunning = false;
        }
    }

    start() {
        if (this.timer) return;

        this.runOnce();

        this.timer = setInterval(() => {
            this.runOnce();
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
