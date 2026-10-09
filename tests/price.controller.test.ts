import { afterAll, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { ClearDatabase, closeDatabase } from '../src/db/database';
import { testConfig } from './setup';
import { Database } from 'sqlite3';
import { createServer } from '../src/server';
import express from 'express';
import { MockCryptoClient } from '../src/clients/mock-crypto.client';
import { PriceSyncJob } from '../src/jobs/price-sync.job';

describe('PriceController', () => {
    let testDb: Database;
    let testApp: express.Express;
    let mockClient: MockCryptoClient;
    let testSync: PriceSyncJob;
    beforeAll(async () => {
        mockClient = new MockCryptoClient();
        let { app, db, port, sync } = await createServer(testConfig, mockClient);
        testApp = app;
        testDb = db;
        testSync = sync;
    });

    beforeEach(async () => {
        await ClearDatabase(testDb);
    });

    afterAll(async () => {
        await closeDatabase(testDb);
    });

    describe('POST /api/cryptocurrencies/', () => {
        test('should update a cryptocurrency', async () => {});
    });
});
