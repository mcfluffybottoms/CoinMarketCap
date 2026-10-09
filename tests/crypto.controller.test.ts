import { afterAll, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { ClearDatabase, closeDatabase } from '../src/db/database';
import { testConfig } from './setup';
import { Database } from 'sqlite3';
import { createServer } from '../src/server';
import request from 'supertest';
import express from 'express';
import { MockCryptoClient } from '../src/clients/mock-crypto.client';

describe('CryptoController', () => {
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

    describe('POST /api/cryptocurrencies/', () => {
        test('should create a new cryptocurrency', async () => {
            const input = mockClient.debugGetMockCoins()[0];

            const start = Date.now();
            const response = await request(testApp)
                .post('/api/cryptocurrencies/')
                .set('Authorization', `Bearer ${testConfig.apiKey}`)
                .send(input);
            const finish = Date.now();

            expect(response.status).toBe(201);
            expect(response.body[0]).toEqual({
                id: expect.any(Number),
                ...input,
                last_updated_at: expect.any(String),
            });

            const lastUpdatedAt = new Date(response.body[0].last_updated_at);
            expect(lastUpdatedAt).not.toBe('Invalid Date');
            expect(lastUpdatedAt.getTime()).toBeGreaterThanOrEqual(start);
            expect(lastUpdatedAt.getTime()).toBeLessThanOrEqual(finish);
        });
        test('should return 400 when symbol is missing', async () => {
            const response = await request(testApp)
                .post('/api/cryptocurrencies/')
                .set('Authorization', `Bearer ${testConfig.apiKey}`)
                .send({
                    name: 'Bitcoin',
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: expect.any(String),
            });
        });
        test('should be able to add with no name', async () => {
            const input = mockClient.debugGetMockCoins();
            const response = await request(testApp)
                .post('/api/cryptocurrencies/')
                .set('Authorization', `Bearer ${testConfig.apiKey}`)
                .send({
                    symbol: 'BTC',
                });

            expect(response.status).toBe(201);

            for (const value of response.body) {
                expect(input).toContainEqual({
                    name: value.name,
                    symbol: value.symbol,
                });
            }
        });
    });

    describe('GET /api/cryptocurrencies/all', () => {
        test('should retrieve all cryptocurrencies', async () => {
            const valuesToAdd = mockClient.debugGetMockCoins();

            for (const value of valuesToAdd) {
                await request(testApp)
                    .post('/api/cryptocurrencies/')
                    .set('Authorization', `Bearer ${testConfig.apiKey}`)
                    .send(value);
            }

            const response = await request(testApp)
                .get('/api/cryptocurrencies/all')
                .set('Authorization', `Bearer ${testConfig.apiKey}`);
            expect(response.status).toBe(200);

            for (const value of valuesToAdd) {
                expect(response.body).toContainEqual({
                    id: expect.any(Number),
                    ...value,
                    last_updated_at: expect.any(String),
                });
            }
        });
        test('should return empty array when there are no cryptocurrencies', async () => {
            const response = await request(testApp)
                .get('/api/cryptocurrencies/all')
                .set('Authorization', `Bearer ${testConfig.apiKey}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });
    });

    describe('GET /api/cryptocurrencies/?id=id&symbol=symbol', () => {
        test('should retrieve cryptocurrency with an id', async () => {
            const input = mockClient.debugGetMockCoins()[0];
            const crypto = (
                await request(testApp)
                    .post('/api/cryptocurrencies/')
                    .set('Authorization', `Bearer ${testConfig.apiKey}`)
                    .send(input)
            ).body[0];
            const response = await request(testApp)
                .get(`/api/cryptocurrencies/?id=${crypto.id}`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`);
            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual([crypto]);
        });

        test('get with id should return 404 status code when not found', async () => {
            const response = await request(testApp)
                .get(`/api/cryptocurrencies/?id=${999999}`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`);
            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                error: expect.any(String),
            });
        });

        test('should retrieve cryptocurrency with symbol', async () => {
            const input = mockClient.debugGetMockCoins()[0];
            const crypto = (
                await request(testApp)
                    .post('/api/cryptocurrencies/')
                    .set('Authorization', `Bearer ${testConfig.apiKey}`)
                    .send(input)
            ).body[0];
            const response = await request(testApp)
                .get(`/api/cryptocurrencies/?symbol=${input.symbol}`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`);
            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual([crypto]);
        });

        test('get with id should return 404 status code when not found', async () => {
            const response = await request(testApp)
                .get(`/api/cryptocurrencies/?id=${999999}`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`);
            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                error: expect.any(String),
            });
        });

        test('returns cryptocurrency when ID and symbol match', async () => {
            const created = (
                await request(testApp)
                    .post('/api/cryptocurrencies/')
                    .set('Authorization', `Bearer ${testConfig.apiKey}`)
                    .send({ symbol: 'BTC', name: 'Bitcoin' })
            ).body[0];

            const response = await request(testApp)
                .get(`/api/cryptocurrencies/?id=${created.id}&symbol=BTC`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`);

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual([created]);
        });

        test('returns 400 when ID and symbol conflict', async () => {
            const created = (
                await request(testApp)
                    .post('/api/cryptocurrencies/')
                    .set('Authorization', `Bearer ${testConfig.apiKey}`)
                    .send({ symbol: 'BTC', name: 'Bitcoin' })
            ).body[0];

            const response = await request(testApp)
                .get(`/api/cryptocurrencies/?id=${created.id}&symbol=ETH`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: 'Cryptocurrency contains a conflict between exclusive peers [id, symbol]',
            });
        });
    });

    describe('PUT /api/cryptocurrencies/:symbol', () => {
        test('should update cryptocurrency with a symbol', async () => {
            const input1 = mockClient.debugGetMockCoins()[0];
            const input2 = mockClient.debugGetMockCoins()[0];
            const added = (
                await request(testApp)
                    .post('/api/cryptocurrencies/')
                    .set('Authorization', `Bearer ${testConfig.apiKey}`)
                    .send(input1)
            ).body[0];

            const start = Date.now();
            const response = await request(testApp)
                .put(`/api/cryptocurrencies/${added.id}`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`)
                .send(input2);
            const finish = Date.now();

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                id: expect.any(Number),
                ...input2,
                last_updated_at: expect.any(String),
            });

            const lastUpdatedAt = new Date(response.body.last_updated_at);
            expect(lastUpdatedAt).not.toBe('Invalid Date');
            expect(lastUpdatedAt.getTime()).toBeGreaterThanOrEqual(start);
            expect(lastUpdatedAt.getTime()).toBeLessThanOrEqual(finish);
        });
        test('PUT should return 400 when id is missing', async () => {
            const response = await request(testApp)
                .put('/api/cryptocurrencies/')
                .set('Authorization', `Bearer ${testConfig.apiKey}`)
                .send({
                    name: 'Bitcoin',
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: expect.any(String),
            });
        });
        test('PUT should return 400 when some fields are missing', async () => {
            const response = await request(testApp)
                .put(`/api/cryptocurrencies/${999999}`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`)
                .send({
                    name: 'Bitcoin',
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: expect.any(String),
            });
        });
    });

    describe('DELETE /api/cryptocurrencies/:id', () => {
        test('should delete cryptocurrency with an id', async () => {
            const input = mockClient.debugGetMockCoins()[0];

            const added = await request(testApp)
                .post('/api/cryptocurrencies/')
                .set('Authorization', `Bearer ${testConfig.apiKey}`)
                .send(input);
            expect(added.status).toBe(201);
            expect(added.body[0]).toEqual({
                id: expect.any(Number),
                ...input,
                last_updated_at: expect.any(String),
            });

            const found = await request(testApp)
                .get(`/api/cryptocurrencies/?id=${added.body[0].id}`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`);
            expect(found.status).toBe(200);

            const deleted = await request(testApp)
                .delete(`/api/cryptocurrencies/${added.body[0].id}`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`);
            expect(deleted.status).toBe(204);

            const notFound = await request(testApp)
                .get(`/api/cryptocurrencies/?id=${added.body[0].id}`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`);
            expect(notFound.status).toBe(404);
        });
        test('delete with id should return not found status code when not found', async () => {
            const input = mockClient.debugGetMockCoins()[0];
            const response = await request(testApp)
                .delete(`/api/cryptocurrencies/${999999}`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`);
            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                error: expect.any(String),
            });
        });

        test('DELETE should return 400 when id is missing', async () => {
            const response = await request(testApp)
                .delete('/api/cryptocurrencies/')
                .set('Authorization', `Bearer ${testConfig.apiKey}`);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: expect.any(String),
            });
        });
    });

    describe('AUTH', () => {
        test('methods do not let in without token', async () => {
            const requests = [
                request(testApp).get('/api/cryptocurrencies/'),
                request(testApp).post('/api/cryptocurrencies/').send({
                    symbol: 'BTC',
                    name: 'Bitcoin',
                }),
                request(testApp).put('/api/cryptocurrencies/1').send({
                    symbol: 'ETH',
                    name: 'Ethereum',
                }),
                request(testApp).delete('/api/cryptocurrencies/1'),
                request(testApp).get('/api/cryptocurrencies/1'),
            ];

            const responses = await Promise.all(requests);

            for (const response of responses) {
                expect(response.status).toBe(401);
                expect(response.body).toEqual({
                    error: 'Unauthorized',
                });
            }
        });
        test('methods do not let in with wrong token', async () => {
            const token = testConfig.apiKey + 'invalid';
            const requests = [
                request(testApp)
                    .get('/api/cryptocurrencies/')
                    .set('Authorization', `Bearer ${token}`),
                request(testApp)
                    .post('/api/cryptocurrencies/')
                    .send({
                        symbol: 'BTC',
                        name: 'Bitcoin',
                    })
                    .set('Authorization', `Bearer ${token}`),
                request(testApp)
                    .put('/api/cryptocurrencies/1')
                    .send({
                        symbol: 'ETH',
                        name: 'Ethereum',
                    })
                    .set('Authorization', `Bearer ${token}`),
                request(testApp)
                    .delete('/api/cryptocurrencies/1')
                    .set('Authorization', `Bearer ${token}`),
                request(testApp)
                    .get('/api/cryptocurrencies/1')
                    .set('Authorization', `Bearer ${token}`),
            ];

            const responses = await Promise.all(requests);

            for (const response of responses) {
                expect(response.status).toBe(401);
                expect(response.body).toEqual({
                    error: 'Unauthorized',
                });
            }
        });
    });
});
