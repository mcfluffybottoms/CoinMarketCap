import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { PriceSyncJob } from '../src/jobs/price-sync.job';
import { PriceService } from '../src/services/price.service';
import { CryptoService } from '../src/services/crypto.service';
import { afterEach } from 'node:test';
import { Cryptocurrency } from '../src/types/crypto';

describe('PriceSyncJob', () => {
    const intervalMs = 60_000;
    let cryptoService: jest.Mocked<CryptoService>;
    let priceService: jest.Mocked<PriceService>;
    let job: PriceSyncJob;

    beforeEach(() => {
        jest.useFakeTimers();
        cryptoService = { findAll: jest.fn() } as unknown as jest.Mocked<CryptoService>;
        priceService = { refreshPrices: jest.fn() } as unknown as jest.Mocked<PriceService>;
        cryptoService.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }] as Cryptocurrency[]);
        priceService.refreshPrices.mockResolvedValue([]);
        job = new PriceSyncJob(priceService, cryptoService, intervalMs);
    });

    afterEach(async () => {
        await job.stop();
        jest.clearAllTimers();
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    describe('constructor', () => {
        test('rejects a zero interval', () => {
            expect(() => new PriceSyncJob(priceService, cryptoService, 0)).toThrow();
        });

        test('rejects a negative interval', () => {
            expect(() => new PriceSyncJob(priceService, cryptoService, -1000)).toThrow();
        });
    });

    describe('PriceSyncJob', () => {
        test('should synchronize prices immediately when started', async () => {
            await job.start();

            expect(cryptoService.findAll).toHaveBeenCalledTimes(1);
            expect(priceService.refreshPrices).toHaveBeenCalledWith([1, 2]);
        });

        test('should synchronize prices at the configured interval', async () => {
            await job.start();

            await jest.advanceTimersByTimeAsync(intervalMs);

            expect(cryptoService.findAll).toHaveBeenCalledTimes(2);
            expect(priceService.refreshPrices).toHaveBeenCalledTimes(2);
        });

        test('should stop scheduling synchronizations after stop()', async () => {
            job.start();

            await jest.advanceTimersByTimeAsync(0);
            await job.stop();
            await jest.advanceTimersByTimeAsync(intervalMs);

            expect(cryptoService.findAll).toHaveBeenCalledTimes(1);
            expect(priceService.refreshPrices).toHaveBeenCalledTimes(1);
        });

        test('does not schedule duplicate jobs when started twice', async () => {
            job.start();
            job.start();

            await jest.advanceTimersByTimeAsync(0);
            expect(cryptoService.findAll).toHaveBeenCalledTimes(1);
            expect(priceService.refreshPrices).toHaveBeenCalledTimes(1);

            await jest.advanceTimersByTimeAsync(intervalMs);

            expect(cryptoService.findAll).toHaveBeenCalledTimes(2);
            expect(priceService.refreshPrices).toHaveBeenCalledTimes(2);
        });
    });
});
