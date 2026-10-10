import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { beforeEach, describe, expect, it, jest, test } from '@jest/globals';
import { CoinMarketCapClient } from '../src/clients/coinmarketcap.client';
import { ClientError } from '../src/errors/errors';
import { CoinMarketCapResponse } from '../src/types/client';

jest.mock('axios', () => ({
    __esModule: true,
    default: {
        create: jest.fn(),
        isAxiosError: jest.fn(),
    },
}));

describe('CoinMarketCapClient', () => {
    let client: CoinMarketCapClient;
    let mockAxios: {
        get: jest.Mock<(url: string, config?: unknown) => Promise<{ data: CoinMarketCapResponse }>>;
    };

    const makeResponse = (coins: Record<string, unknown>): { data: CoinMarketCapResponse } =>
        ({ data: { data: coins } }) as { data: CoinMarketCapResponse };

    const bitcoin = {
        id: 1,
        name: 'Bitcoin',
        symbol: 'BTC',
        quote: { USD: { price: 65000 } },
    };

    const ethereum = {
        id: 3423,
        name: 'Ethereum',
        symbol: 'ETH',
        quote: { USD: { price: 3200 } },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockAxios = {
            get: jest.fn(),
        };
        (axios.isAxiosError as unknown as jest.Mock).mockImplementation(
            (error: unknown) =>
                typeof error === 'object' &&
                error !== null &&
                'isAxiosError' in error &&
                (error as { isAxiosError?: boolean }).isAxiosError === true,
        );

        (axios.create as jest.Mock).mockReturnValue(mockAxios as unknown as AxiosInstance);
        client = new CoinMarketCapClient('test-api-key', 'USD');
    });

    describe('constructor', () => {
        test('throws when the api key is empty', () => {
            expect(() => new CoinMarketCapClient('', 'USD')).toThrow(ClientError);
        });

        test('trims the api key and configures axios', () => {
            new CoinMarketCapClient('  test-api-key  ', 'USD', 3000);

            expect(axios.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    baseURL: 'https://pro-api.coinmarketcap.com',
                    timeout: 3000,
                    headers: expect.objectContaining({
                        Accept: 'application/json',
                        'X-CMC_PRO_API_KEY': 'test-api-key',
                    }),
                }),
            );
        });
    });

    describe('api error handling', () => {
        test('wraps api errors in ClientError', async () => {
            const error = Object.assign(new Error('Network failure'), {
                isAxiosError: true,
                code: 'ERR_NETWORK',
            });
            (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
            mockAxios.get.mockRejectedValue(error);

            await expect(client.getPrice(1)).rejects.toThrow(
                'Failed to fetch cryptocurrency prices',
            );
        });

        test('wraps an Axios timeout in ClientError', async () => {
            const error = Object.assign(new Error('Network failure'), {
                isAxiosError: true,
                code: 'ETIMEDOUT',
            });
            (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
            mockAxios.get.mockRejectedValue(error);

            await expect(client.getPrice(1)).rejects.toThrow('CoinMarketCap request timed out');
        });
    });

    describe('getPrice', () => {
        test('rejects when the requested currency quote is missing', async () => {
            mockAxios.get.mockResolvedValue(
                makeResponse({
                    '1': {
                        ...bitcoin,
                        quote: {},
                    },
                }),
            );
            await expect(client.getPrice(1)).rejects.toThrow('Price is not positive for 1');
        });
        test('returns the price for a cmc id', async () => {
            mockAxios.get.mockResolvedValue(makeResponse({ '1': bitcoin }));
            const price = await client.getPrice(1);
            expect(mockAxios.get).toHaveBeenCalledWith('/v1/cryptocurrency/quotes/latest', {
                params: {
                    id: '1',
                    convert: 'USD',
                },
            });

            expect(price).toBe(65000);
        });

        test('throws when the requested coin is not returned', async () => {
            mockAxios.get.mockResolvedValue(makeResponse({}));

            await expect(client.getPrice(1)).rejects.toThrow('No price returned for cmc id 1');
        });
    });

    describe('getPrices', () => {
        test('resolves when the requested currency quote is missing', async () => {
            mockAxios.get.mockResolvedValue(
                makeResponse({
                    '1': {
                        ...bitcoin,
                        quote: {},
                    },
                }),
            );
            await expect(client.getPrices([1])).resolves.toEqual([
                {
                    id: 1,
                    price: undefined,
                },
            ]);
        });
        test('returns the prices for multiple ids', async () => {
            mockAxios.get.mockResolvedValue(
                makeResponse({
                    '1': bitcoin,
                    '3423': ethereum,
                }),
            );
            const prices = client.getPrices([1, 3423]);
            await expect(prices).resolves.toEqual([
                { id: 1, price: 65000 },
                { id: 3423, price: 3200 },
            ]);
            expect(mockAxios.get).toHaveBeenCalledWith('/v1/cryptocurrency/quotes/latest', {
                params: { id: '1,3423', convert: 'USD' },
            });
        });

        test('returns an empty array without making an api request', async () => {
            await expect(client.getPrices([])).resolves.toEqual([]);
            expect(mockAxios.get).not.toHaveBeenCalled();
        });

        test.each([0, -1, -100])('rejects invalid id %s', async (id) => {
            await expect(client.getPrices([id])).rejects.toThrow(
                'Cryptocurrency IDs must be positive integers',
            );

            expect(mockAxios.get).not.toHaveBeenCalled();
        });

        test('resolves a negative price returned by the API to undefined', async () => {
            mockAxios.get.mockResolvedValue(
                makeResponse({
                    '1': {
                        ...bitcoin,
                        quote: { USD: { price: -1 } },
                    },
                }),
            );

            await expect(client.getPrices([1])).resolves.toEqual([
                {
                    id: 1,
                    price: undefined,
                },
            ]);
        });
    });

    describe('getCoinInfo', () => {
        beforeEach(() => {
            mockAxios.get.mockResolvedValue(
                makeResponse({
                    '1': bitcoin,
                    '3423': ethereum,
                    '1839': {
                        id: 1839,
                        name: 'Bitcoin Cash',
                        symbol: 'BCH',
                        quote: { USD: { price: 300 } },
                    },
                }),
            );
        });

        test('returns coin information matching the symbol and name', async () => {
            await expect(client.getCoinInfo({ symbol: 'BTC', name: ' bitcoin ' })).resolves.toEqual(
                [
                    {
                        apiId: 1,
                        record: { name: 'Bitcoin', symbol: 'BTC' },
                    },
                ],
            );

            expect(mockAxios.get).toHaveBeenCalledWith('/v1/cryptocurrency/quotes/latest', {
                params: { symbol: 'BTC', convert: 'USD' },
            });
        });

        test('matches the symbol case-insensitively when name is omitted', async () => {
            return await expect(
                client.getCoinInfo({
                    symbol: 'eTh',
                    name: undefined,
                }),
            ).resolves.toEqual([
                {
                    apiId: 3423,
                    record: { name: 'Ethereum', symbol: 'ETH' },
                },
            ]);
        });

        test('returns an empty array when no coin matches', async () => {
            await expect(
                client.getCoinInfo({ symbol: 'BTC', name: 'Different Coin' }),
            ).resolves.toEqual([]);
        });

        test('throws when the symbol is missing', async () => {
            await expect(
                client.getCoinInfo({
                    symbol: '   ',
                    name: undefined,
                }),
            ).rejects.toThrow('Cryptocurrency symbol is required');

            expect(mockAxios.get).not.toHaveBeenCalled();
        });
    });
});
