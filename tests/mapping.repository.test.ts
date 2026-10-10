import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ClearDatabase, closeDatabase, getDatabase, runMigrations } from '../src/db/database';
import { testConfig } from './setup';
import { Database } from 'sqlite3';
import { MappingIdToApiRepository } from '../src/repositories/id-mapping.repository';

describe('MappingIdToApiRepository', () => {
    let testDb: Database;
    let repository: MappingIdToApiRepository;
    beforeAll(async () => {
        testDb = await getDatabase(testConfig.databasePath);
        await runMigrations(testDb, testConfig.migrationsPath);
        repository = new MappingIdToApiRepository(testDb);
    });

    beforeEach(async () => {
        await ClearDatabase(testDb);
        await repository.save(1, 100);
        await repository.save(2, 200);
        await repository.save(3, 300);
    });

    afterAll(async () => {
        await closeDatabase(testDb);
    });

    describe('getApiIdById', () => {
        test('returns the API id for an existing crypto ID', async () => {
            await expect(repository.getApiIdById(1)).resolves.toBe(100);
        });

        test('returns null when the crypto ID does not exist', async () => {
            await expect(repository.getApiIdById(999)).resolves.toBeNull();
        });
    });

    describe('getApiIdsByIds', () => {
        test('returns API id and a apiId-to-cryptoId map', async () => {
            const result = await repository.getApiIdsByIds([1, 3]);

            expect(result.cmc_ids).toHaveLength(2);
            expect(result.cmc_ids).toEqual(expect.arrayContaining([100, 300]));

            expect(result.mapping).toBeInstanceOf(Map);
            expect(result.mapping.size).toBe(2);
            expect(result.mapping.get(100)).toBe(1);
            expect(result.mapping.get(300)).toBe(3);
        });

        test('returns empty collections when given no ids', async () => {
            const result = await repository.getApiIdsByIds([]);

            expect(result.cmc_ids).toEqual([]);
            expect(result.mapping).toBeInstanceOf(Map);
            expect(result.mapping.size).toBe(0);
        });

        test('returns only mappings for the requested ids', async () => {
            const result = await repository.getApiIdsByIds([2]);

            expect(result.cmc_ids).toEqual([200]);
            expect(result.mapping.get(200)).toBe(2);
            expect(result.mapping.has(100)).toBe(false);
        });
    });

    describe('existsByApiId', () => {
        test('returns true when the apiId exists', async () => {
            await expect(repository.existsByApiId(200)).resolves.toBe(true);
        });

        test('returns false when the apiId does not exist', async () => {
            await expect(repository.existsByApiId(999)).resolves.toBe(false);
        });
    });

    describe('save', () => {
        test('inserts a new mapping', async () => {
            await expect(repository.save(4, 400)).resolves.toBeUndefined();

            await expect(repository.getApiIdById(4)).resolves.toBe(400);
        });

        test('updates the apiId when the cryptoId already exists', async () => {
            await repository.save(1, 999);

            await expect(repository.getApiIdById(1)).resolves.toBe(999);
        });
    });
});
