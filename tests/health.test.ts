import request from 'supertest';
import app from '../src/app';
import { describe, expect, jest, test } from '@jest/globals';

describe('GET /api/health', () => {
    test('should return 200 and status ok', async () => {
        const response = await request(app).get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            status: 'ok',
        });
    });

    test('should return 404 for unknown route', async () => {
        const response = await request(app).get('/api/unknown');

        expect(response.status).toBe(404);
    });
});
