import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';

import { ClearDatabase, closeDatabase } from '../src/db/database';
import { testConfig } from './setup';
import { Database } from 'sqlite3';
import { createServer } from '../src/server';
import request from 'supertest';
import express from 'express';

describe('CryptoRepository', () => {
    let testDb: Database;
    let testApp: express.Express;
    beforeAll(async () => {
        let { app, db } = await createServer(testConfig);
        testApp = app;
        testDb = db;
    });

    beforeEach(async () => {
        await ClearDatabase(testDb);
    });

    afterAll(async () => {
        await closeDatabase(testDb);
    });

    describe('POST /api/', () => {
        test('should create a new cryptocurrency', async () => {
            const input = {
                symbol: 'BTC',
                name: 'Bitcoin',
            };

            const start = Date.now();
            const response = await request(testApp)
                .post('/api/')
                .set('Authorization', `Bearer ${testConfig.apiKey}`)
                .send(input);
            const finish = Date.now();

            expect(response.status).toBe(201);
            expect(response.body).toEqual({
                id: expect.any(Number),
                ...input,
                last_updated_at: expect.any(String),
            });

            const lastUpdatedAt = new Date(response.body.last_updated_at);
            expect(lastUpdatedAt).not.toBe('Invalid Date');
            expect(lastUpdatedAt.getTime()).toBeGreaterThanOrEqual(start);
            expect(lastUpdatedAt.getTime()).toBeLessThanOrEqual(finish);
        });
        test('should return 400 when some fields are missing', async () => {
            const response = await request(testApp)
                .post('/api/')
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

    describe('GET /api/', () => {
        test('should retrieve all cryptocurrencies', async () => {
            const valuesToAdd = [
                { symbol: 'BTC', name: 'Bitcoin' },
                { symbol: 'ETH', name: 'Ethereum' },
                { symbol: 'LTC', name: 'Litecoin' },
            ];

            for (const value of valuesToAdd) {
                await request(testApp)
                    .post('/api/')
                    .set('Authorization', `Bearer ${testConfig.apiKey}`)
                    .send(value);
            }

            const response = await request(testApp)
                .get('/api/')
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
                .get('/api/')
                .set('Authorization', `Bearer ${testConfig.apiKey}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });
    });

    describe('GET /api/:id', () => {
        test('should retrieve cryptocurrency with an id', async () => {
            const input = {
                symbol: 'BTC',
                name: 'Bitcoin',
            };
            const crypto = (
                await request(testApp)
                    .post('/api/')
                    .set('Authorization', `Bearer ${testConfig.apiKey}`)
                    .send(input)
            ).body;
            const response = await request(testApp)
                .get(`/api/${crypto.id}`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`);
            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual(crypto);
        });
        test('get with id should return not found status code when not found', async () => {
            const response = await request(testApp)
                .get(`/api/${999999}`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`);
            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                error: expect.any(String),
            });
        });
    });

    describe('PUT /api/:id', () => {
        test('should update cryptocurrency with an id', async () => {
            const input1 = {
                symbol: 'BTC',
                name: 'Bitcoin',
            };
            const input2 = {
                symbol: 'BTC',
                name: 'Bitcoin',
            };
            const added = (
                await request(testApp)
                    .post('/api/')
                    .set('Authorization', `Bearer ${testConfig.apiKey}`)
                    .send(input1)
            ).body;

            const start = Date.now();
            const response = await request(testApp)
                .put(`/api/${added.id}`)
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
                .put('/api/')
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
                .put(`/api/${999999}`)
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

    describe('DELETE /api/:id', () => {
        test('should delete cryptocurrency with an id', async () => {
            const input = {
                symbol: 'BTC',
                name: 'Bitcoin',
            };

            const added = await request(testApp)
                .post('/api/')
                .set('Authorization', `Bearer ${testConfig.apiKey}`)
                .send(input);
            expect(added.status).toBe(201);
            expect(added.body).toEqual({
                id: expect.any(Number),
                ...input,
                last_updated_at: expect.any(String),
            });

            const found = await request(testApp)
                .get(`/api/${added.body.id}`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`);
            expect(found.status).toBe(200);

            const deleted = await request(testApp)
                .delete(`/api/${added.body.id}`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`);
            expect(deleted.status).toBe(204);

            const notFound = await request(testApp)
                .get(`/api/${added.body.id}`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`);
            expect(notFound.status).toBe(404);
        });
        test('delete with id should return not found status code when not found', async () => {
            const input = {
                symbol: 'BTC',
                name: 'Bitcoin',
            };
            const response = await request(testApp)
                .delete(`/api/${999999}`)
                .set('Authorization', `Bearer ${testConfig.apiKey}`);
            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                error: expect.any(String),
            });
        });

        test('DELETE should return 400 when id is missing', async () => {
            const response = await request(testApp)
                .delete('/api/')
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
                request(testApp).get('/api/'),
                request(testApp).post('/api/').send({
                    symbol: 'BTC',
                    name: 'Bitcoin',
                }),
                request(testApp).put('/api/1').send({
                    symbol: 'ETH',
                    name: 'Ethereum',
                }),
                request(testApp).delete('/api/1'),
                request(testApp).get('/api/1'),
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
                request(testApp).get('/api/').set('Authorization', `Bearer ${token}`),
                request(testApp)
                    .post('/api/')
                    .send({
                        symbol: 'BTC',
                        name: 'Bitcoin',
                    })
                    .set('Authorization', `Bearer ${token}`),
                request(testApp)
                    .put('/api/1')
                    .send({
                        symbol: 'ETH',
                        name: 'Ethereum',
                    })
                    .set('Authorization', `Bearer ${token}`),
                request(testApp).delete('/api/1').set('Authorization', `Bearer ${token}`),
                request(testApp).get('/api/1').set('Authorization', `Bearer ${token}`),
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
