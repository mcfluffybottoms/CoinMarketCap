import { ClientError } from '../errors/errors';
import { MappingIdToApiRepository } from '../repositories/id-mapping.repository';
import { CoinInfo, CoinPrice } from '../types/client';
import { CreateCryptocurrencyRequest, CreateCryptocurrencyRecord } from '../types/crypto';
import { CryptoClient } from './client';

type MockData = {
    symbol: string;
    name: string;
    basePrice: number;
};

export class MockCryptoClient implements CryptoClient {
    private data: MockData[] = [
        { symbol: 'BTC', name: 'Bitcoin', basePrice: 65000 },
        { symbol: 'ETH', name: 'Ethereum', basePrice: 3200 },
        { symbol: 'SOL', name: 'Solana', basePrice: 150 },
        { symbol: 'XRP', name: 'XRP', basePrice: 0.55 },
        { symbol: 'LTC', name: 'Litecoin', basePrice: 0.85 },
        { symbol: 'BTC', name: 'Bitcoin1', basePrice: 65000 },
        { symbol: 'BTC', name: 'Bitcoin2', basePrice: 65000 },
    ];

    async getPrice(apiId: number): Promise<number> {
        const coin = this.data[apiId];
        if (coin == undefined) {
            throw new ClientError('No id like this present.');
        }

        const price = coin.basePrice;
        const variation = 1 + (Math.random() * 0.04 - 0.02);

        return Number((price * variation).toFixed(8));
    }

    async getPrices(coins: { id: number }[]): Promise<CoinPrice[]> {
        const prices = [];
        for (const coin of coins) {
            prices.push({
                id: coin.id,
                price: await this.getPrice(coin.id),
            });
        }
        return prices;
    }

    async getCoinInfo(input: CreateCryptocurrencyRequest): Promise<CoinInfo[]> {
        const symbol = input.symbol.trim().toUpperCase();
        const name = input.name;

        const records = [];
        for (let i = 0; i < this.data.length; i++) {
            const coin = this.data[i]!;
            if (coin.symbol === symbol && (name === undefined || name === coin.name)) {
                records.push({
                    apiId: i,
                    record: {
                        symbol: coin.symbol,
                        name: coin.name,
                    },
                });
            }
        }

        return records;
    }

    debugGetMockCoins(): CreateCryptocurrencyRecord[] {
        return this.data.map(({ name, symbol }) => ({
            name,
            symbol,
        }));
    }
}
