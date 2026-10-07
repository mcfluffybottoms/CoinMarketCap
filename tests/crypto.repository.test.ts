import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';

import { ClearDatabase, closeDatabase, getDatabase, runMigrations } from '../src/db/database';
import { CryptoRepository, CryptoRepositoryImpl } from '../src/repositories/crypto.repository';
import { testConfig } from './setup';
import { Database } from 'sqlite3';

describe('CryptoRepository', () => {
    let testDb: Database;
    let testCryptoRepository: CryptoRepository;
    beforeAll(async () => {
        testDb = await getDatabase(testConfig.databasePath);
        testCryptoRepository = new CryptoRepositoryImpl(testDb);
        runMigrations(testDb, testConfig.migrationsPath);
    });

    beforeEach(async () => {
        ClearDatabase(testDb);
    });

    afterAll(async () => {
        await closeDatabase(testDb);
    });

    describe('createCryptocurrency', () => {
        test('should create a new cryptocurrency', async () => {
            const input = {
                symbol: 'BTC',
                name: 'Bitcoin',
            };

            const start = Date.now();
            const result = await testCryptoRepository.create(input);
            const finish = Date.now();

            expect(result).toEqual({
                id: expect.any(Number),
                ...input,
                last_updated_at: expect.any(String),
            });

            const lastUpdatedAt = new Date(result.last_updated_at);
            expect(lastUpdatedAt).not.toBe('Invalid Date');
            expect(lastUpdatedAt.getTime()).toBeGreaterThanOrEqual(start);
            expect(lastUpdatedAt.getTime()).toBeLessThanOrEqual(finish);
        });
    });

    describe('getCryptocurrencyById', () => {
        test('should get an existing cryptocurrency', async () => {
            const input = {
                symbol: 'BTC',
                name: 'Bitcoin',
            };

            const start = Date.now();
            const added = await testCryptoRepository.create(input);
            const finish = Date.now();

            const result = await testCryptoRepository.findById(added.id);

            expect(result).not.toBeNull();
            expect(result).toEqual({
                id: expect.any(Number),
                ...input,
                last_updated_at: expect.any(String),
            });

            const lastUpdatedAt = new Date(added!.last_updated_at);
            expect(lastUpdatedAt).not.toBe('Invalid Date');
            expect(lastUpdatedAt.getTime()).toBeGreaterThanOrEqual(start);
            expect(lastUpdatedAt.getTime()).toBeLessThanOrEqual(finish);
        });
    });

    describe('deleteCryptocurrency', () => {
        test('should delete an existing cryptocurrency', async () => {
            const input = {
                symbol: 'BTC',
                name: 'Bitcoin',
            };

            const added = await testCryptoRepository.create(input);
            const found = await testCryptoRepository.findById(added.id);
            expect(found).not.toBeNull();

            await testCryptoRepository.delete(added.id);
            const deleted = await testCryptoRepository.findById(added.id);
            expect(deleted).toBeNull();
        });
    });

    describe('findAllCryptos', () => {
        test('should return all cryptocurrencies', async () => {
            const valuesToAdd = [
                { symbol: 'BTC', name: 'Bitcoin' },
                { symbol: 'ETH', name: 'Ethereum' },
                { symbol: 'LTC', name: 'Litecoin' },
            ];
            for (const value of valuesToAdd) {
                await testCryptoRepository.create(value);
            }

            const cryptos = await testCryptoRepository.findAll();
            expect(cryptos).toHaveLength(valuesToAdd.length);
            for (const value of valuesToAdd) {
                expect(cryptos).toContainEqual({
                    id: expect.any(Number),
                    ...value,
                    last_updated_at: expect.any(String),
                });
            }
        });
    });

    describe('findBySymbol', () => {
        test('should return all cryptocurrencies with the specified symbol', async () => {
            const valuesToAdd = [
                { symbol: 'BTC', name: 'Bitcoin' },
                { symbol: 'BTC', name: 'Bitcoin 1' },
                { symbol: 'LTC', name: 'Litecoin' },
            ];
            for (const value of valuesToAdd) {
                await testCryptoRepository.create(value);
            }

            const cryptos = await testCryptoRepository.findBySymbol('BTC');
            expect(cryptos).toHaveLength(2);
            for (const value of cryptos) {
                expect(value.symbol).toBe('BTC');
            }

            for (const value of valuesToAdd) {
                if (value.symbol === 'BTC') {
                    expect(cryptos).toContainEqual({
                        id: expect.any(Number),
                        ...value,
                        last_updated_at: expect.any(String),
                    });
                }
            }
        });
    });

    describe('updateCrypto', () => {
        test('should update a cryptocurrency', async () => {
            const input1 = {
                symbol: 'BTC',
                name: 'Bitcoin',
            };
            const input2 = {
                symbol: 'ETH',
                name: 'Ethereum',
            };

            const added = await testCryptoRepository.create(input1);

            const updateStart = Date.now();
            const result = await testCryptoRepository.update(added.id, input2);
            const updateFinish = Date.now();

            expect(result).not.toBeNull();
            expect(result).toEqual({
                id: expect.any(Number),
                ...input2,
                last_updated_at: expect.any(String),
            });

            const lastUpdatedAt = new Date(result!.last_updated_at);
            expect(lastUpdatedAt).not.toBe('Invalid Date');
            expect(lastUpdatedAt.getTime()).toBeGreaterThanOrEqual(updateStart);
            expect(lastUpdatedAt.getTime()).toBeLessThanOrEqual(updateFinish);
        });
    });

    // describe('create an existing coin throws error', () => {
    //     test('should update a cryptocurrency', async () => {
    //         const input = {
    //             symbol: 'BTC',
    //             name: 'Bitcoin',
    //         };

    //         const start = Date.now();
    //         const result = await testCryptoRepository.create(input);
    //         const finish = Date.now();

    //         expect(result).toEqual({
    //             id: expect.any(Number),
    //             ...input,
    //             last_updated_at: expect.any(String),
    //         });

    //         const lastUpdatedAt = new Date(result.last_updated_at);
    //         expect(lastUpdatedAt).not.toBe('Invalid Date');
    //         expect(lastUpdatedAt.getTime()).toBeGreaterThanOrEqual(start);
    //         expect(lastUpdatedAt.getTime()).toBeLessThanOrEqual(finish);
    //     });
    // });

    describe('deleteNonExisting', () => {
        test('delete a non existing coin returns null', async () => {
            const result = await testCryptoRepository.delete(999999);
            expect(result).toBe(false);
        });
    });

    describe('updateNonExisting', () => {
        test('update a non existing cryptocurrency returns null', async () => {
            const result = await testCryptoRepository.update(999999, {
                symbol: 'ETH',
                name: 'Ethereum',
            });
            expect(result).toBeNull();
        });
    });
});
