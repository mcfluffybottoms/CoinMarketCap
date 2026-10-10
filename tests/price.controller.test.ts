import { afterAll, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { ClearDatabase, closeDatabase } from '../src/db/database';
import { testConfig } from './setup';
import { Database } from 'sqlite3';
import { createServer } from '../src/server';
import request from 'supertest';
import express from 'express';
import { MockCryptoClient } from '../src/clients/mock-crypto.client';

describe('PriceController', () => {
    let testDb: Database;
    let testApp: express.Express;
    let mockClient: MockCryptoClient;
    beforeAll(async () => {
        mockClient = new MockCryptoClient();
        let { app, db } = await createServer(testConfig, mockClient);
        testApp = app;
        testDb = db;
    });

    beforeEach(async () => {
        await ClearDatabase(testDb);
    });

    afterAll(async () => {
        await closeDatabase(testDb);
    });

    describe('POST /api/cryptocurrencies/:id/price/refresh', () => {
        test('should refresh a cryptocurrency price', async () => {
            const cryptoResponse = await request(testApp)
                .post('/api/cryptocurrencies')
                .set('Authorization', `Bearer ${testConfig.apiKey}`)
                .send(mockClient.debugGetMockCoins()[0]);

            expect(cryptoResponse.status).toBe(201);

            const cryptoId = cryptoResponse.body[0].id;
            const response = await request(testApp)
                .post(`/api/cryptocurrencies/${cryptoId}/price/refresh`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`);

            expect(response.status).toBe(201);
            expect(response.body).toEqual(
                expect.objectContaining({
                    cryptocurrencyId: cryptoId,
                    price: expect.any(Number),
                }),
            );
        });

        test('should return 400 for a non-numeric ID', async () => {
            const response = await request(testApp)
                .post('/api/cryptocurrencies/abc/price/refresh')
                .set('Authorization', `Bearer ${testConfig.apiKey}`);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('should return 400 for a zero ID', async () => {
            const response = await request(testApp)
                .post('/api/cryptocurrencies/0/price/refresh')
                .set('Authorization', `Bearer ${testConfig.apiKey}`);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/cryptocurrencies/:id/price', () => {
        test('should return 404 when no price history exists', async () => {
            const cryptoResponse = await request(testApp)
                .post('/api/cryptocurrencies')
                .set('Authorization', `Bearer ${testConfig.apiKey}`)
                .send({
                    symbol: 'BTC',
                    name: 'Bitcoin',
                });

            expect(cryptoResponse.status).toBe(201);
            const cryptoId = cryptoResponse.body[0].id;

            const response = await request(testApp)
                .get(`/api/cryptocurrencies/${cryptoId}/price`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Price history not found for this cryptocurrency');
        });
    });

    describe('GET /api/cryptocurrencies/:id/history', () => {
        test('should return an empty array when no price history exists', async () => {
            const cryptoResponse = await request(testApp)
                .post('/api/cryptocurrencies')
                .set('Authorization', `Bearer ${testConfig.apiKey}`)
                .send({
                    symbol: 'BTC',
                    name: 'Bitcoin',
                });

            expect(cryptoResponse.status).toBe(201);

            const cryptoId = cryptoResponse.body[0].id;

            const response = await request(testApp)
                .get(`/api/cryptocurrencies/${cryptoId}/history`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });

        test('should return 400 for an invalid cryptocurrency ID', async () => {
            const response = await request(testApp)
                .get('/api/cryptocurrencies/abc/history')
                .set('Authorization', `Bearer ${testConfig.apiKey}`);
            expect(response.status).toBe(400);
        });
    });
});
