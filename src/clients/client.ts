import { CoinInfo, CoinPrice } from '../types/client';
import { CreateCryptocurrencyRequest } from '../types/crypto';

export interface CryptoClient {
    getPrice(id: number): Promise<number>;
    getPrices(ids: number[]): Promise<CoinPrice[]>;
    getCoinInfo(symbol: CreateCryptocurrencyRequest): Promise<CoinInfo[]>;
}
