import axios, { AxiosInstance } from 'axios';
import { ClientError } from '../errors/errors';
import { CoinInfo, CoinMarketCapResponse, CoinPrice } from '../types/client';
import { CryptoClient } from './client';
import { CreateCryptocurrencyRequest } from '../types/crypto';

export class CoinMarketCapClient implements CryptoClient {
    private readonly client: AxiosInstance;

    constructor(
        apiKey: string,
        private readonly currency: string,
        timeoutMs = 5000,
    ) {
        if (!apiKey.trim()) {
            throw new ClientError('No api key present', 401);
        }
        this.client = axios.create({
            baseURL: 'https://pro-api.coinmarketcap.com',
            timeout: timeoutMs,
            headers: {
                Accept: 'application/json',
                'X-CMC_PRO_API_KEY': apiKey.trim(),
            },
        });
    }

    private handleApiError(error: unknown, context: string): ClientError {
        if (!axios.isAxiosError(error)) {
            return new ClientError(`Failed to fetch cryptocurrency ${context}`, 502);
        }

        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            return new ClientError('CoinMarketCap request timed out', 504);
        }

        if (error.response?.status === 401) {
            return new ClientError('CoinMarketCap authentication failed', 401);
        }

        if (error.response?.status === 400) {
            return new ClientError('CoinMarketCap rejected the request', 400);
        }

        if (error.response?.status === 429) {
            return new ClientError('CoinMarketCap rate limit exceeded', 429);
        }

        return new ClientError(`Failed to fetch cryptocurrency ${context}`, 502);
    }

    async getPrice(id: number): Promise<number> {
        const prices = await this.getPrices([id]);
        const coin = prices.find((item) => item.id === id);
        if (!coin) {
            throw new ClientError(`No price returned for cmc id ${id}`, 400);
        }
        if (coin?.price == undefined || coin?.price < 0) {
            throw new ClientError(`Price is not positive for ${coin!.id}`, 400);
        }
        return coin.price;
    }

    async getPrices(ids: number[]): Promise<CoinPrice[]> {
        if (ids.length === 0) {
            return [];
        }

        if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
            throw new ClientError('Cryptocurrency IDs must be positive integers', 400);
        }

        try {
            const response = await this.client.get<CoinMarketCapResponse>(
                '/v1/cryptocurrency/quotes/latest',
                {
                    params: {
                        id: ids.join(','),
                        convert: this.currency,
                    },
                },
            );

            return Object.values(response.data.data).map((coin) => {
                const price = coin.quote[this.currency]?.price!;
                if (!Number.isFinite(price) || price < 0) {
                    return { id: coin.id, price: undefined };
                }
                return { id: coin.id, price };
            });
        } catch (error) {
            if (error instanceof ClientError) {
                throw error;
            }

            throw this.handleApiError(error, 'prices');
        }
    }

    async getCoinInfo(request: CreateCryptocurrencyRequest): Promise<CoinInfo[]> {
        const symbol = request.symbol?.trim().toUpperCase();
        const name = request.name?.trim().toLowerCase();

        if (!symbol) {
            throw new ClientError('Cryptocurrency symbol is required', 400);
        }

        try {
            const response = await this.client.get<CoinMarketCapResponse>(
                '/v1/cryptocurrency/quotes/latest',
                {
                    params: {
                        symbol,
                        convert: this.currency,
                    },
                },
            );

            return Object.values(response.data.data)
                .filter((coin) => {
                    const symbolMatches = coin.symbol.trim().toUpperCase() === symbol;
                    const nameMatches = !name || coin.name.trim().toLowerCase() === name;
                    return symbolMatches && nameMatches;
                })
                .map((coin) => ({
                    apiId: coin.id,
                    record: {
                        name: coin.name,
                        symbol: coin.symbol,
                    },
                }));
        } catch (error) {
            if (error instanceof ClientError) {
                throw error;
            }

            throw this.handleApiError(error, 'prices');
        }
    }
}
