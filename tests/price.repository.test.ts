import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';

import { ClearDatabase, closeDatabase, getDatabase, runMigrations } from '../src/db/database';
import { PriceRepository, PriceRepositoryImpl } from '../src/repositories/price.repository';
import { testConfig } from './setup';
import { Database } from 'sqlite3';
import { CryptoRepository, CryptoRepositoryImpl } from '../src/repositories/crypto.repository';

describe('PriceRepository', () => {
    let testDb: Database;
    let testPriceRepository: PriceRepository;
    let testCryptoRepository: CryptoRepository;
    beforeAll(async () => {
        testDb = await getDatabase(testConfig.databasePath);
        testPriceRepository = new PriceRepositoryImpl(testDb);
        testCryptoRepository = new CryptoRepositoryImpl(testDb);
        runMigrations(testDb, testConfig.migrationsPath);
    });

    beforeEach(async () => {
        ClearDatabase(testDb);
    });

    afterAll(async () => {
        await closeDatabase(testDb);
    });

    describe('createPrice', () => {
        test('should create a new price', async () => {
            const coinInput = {
                symbol: 'BTC',
                name: 'Bitcoin',
            };
            const added = await testCryptoRepository.create(coinInput);

            const input = {
                cryptocurrencyId: added.id,
                price: 50000,
                fetched_at: new Date().toISOString(),
            };
            const result = await testPriceRepository.create(input);

            expect(result).toEqual({
                id: expect.any(Number),
                ...input,
            });
        });
    });

    describe('findLatestByCryptoId', () => {
        test('should get an existing price', async () => {
            const coinInput = {
                symbol: 'BTC',
                name: 'Bitcoin',
            };
            const added = await testCryptoRepository.create(coinInput);

            const input = {
                cryptocurrencyId: added.id,
                price: 50000,
                fetched_at: new Date().toISOString(),
            };
            await testPriceRepository.create(input);
            const result = await testPriceRepository.findLatestByCryptoId(input.cryptocurrencyId);
            expect(result).toEqual({
                id: expect.any(Number),
                ...input,
            });
        });
    });

    describe('findLatestCryptoIdIsActuallyLatest', () => {
        test('should get an actually latest price', async () => {
            const coinInput = {
                symbol: 'BTC',
                name: 'Bitcoin',
            };
            const added = await testCryptoRepository.create(coinInput);

            const actualLatestPrice = {
                cryptocurrencyId: added.id,
                price: 10,
                fetched_at: '2027-10-07T11:00:00.000Z',
            };
            const inputs = [
                {
                    cryptocurrencyId: added.id,
                    price: 50000,
                    fetched_at: '2026-10-07T10:00:00.000Z',
                },
                actualLatestPrice,
                {
                    cryptocurrencyId: added.id,
                    price: 132000,
                    fetched_at: '2025-10-07T12:00:00.000Z',
                },
                {
                    cryptocurrencyId: added.id,
                    price: 51000,
                    fetched_at: '2026-10-07T11:00:00.000Z',
                },
                {
                    cryptocurrencyId: added.id,
                    price: 52000,
                    fetched_at: '2026-10-07T12:00:00.000Z',
                },
            ];
            for (const input of inputs) {
                await testPriceRepository.create(input);
            }
            const result = await testPriceRepository.findLatestByCryptoId(added.id);
            expect(result).toEqual({
                id: expect.any(Number),
                ...actualLatestPrice,
            });
        });
    });

    describe('findHistoryByCryptoId', () => {
        test('should get an existing price by crypto id', async () => {
            const coinInput = {
                symbol: 'BTC',
                name: 'Bitcoin',
            };
            const added = await testCryptoRepository.create(coinInput);

            const input = {
                cryptocurrencyId: added.id,
                price: 50000,
                fetched_at: new Date().toISOString(),
            };
            await testPriceRepository.create(input);
            const result = await testPriceRepository.findHistoryByCryptoId(input.cryptocurrencyId);
            expect(result).toEqual([
                {
                    id: expect.any(Number),
                    ...input,
                },
            ]);
        });
    });

    describe('findLatestByNonExistingCryptoId', () => {
        test('Should return null for non-existing crypto id', async () => {
            const result = await testPriceRepository.findLatestByCryptoId(9999999);
            expect(result).toBeNull();
        });
    });

    describe('findHistoryByNonExistingCryptoId', () => {
        test('should get an empty array for non-existing crypto id', async () => {
            const result = await testPriceRepository.findHistoryByCryptoId(9999999);
            expect(result).toEqual([]);
        });
    });

    describe('createPriceNonExistingCoinFails', () => {
        test('should throw when trying to create with non-existing coin', async () => {
            const input = {
                cryptocurrencyId: 9999999,
                price: 50000,
                fetched_at: new Date().toISOString(),
            };
            await expect(testPriceRepository.create(input)).rejects.toThrow();
        });
    });
});
