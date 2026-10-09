import { CreateCryptocurrencyRecord } from './crypto';

export type CoinPrice = {
    id: number;
    price: number;
};

export type CoinInfo = {
    apiId: number;
    record: CreateCryptocurrencyRecord;
};

export type CoinMarketCapQuote = {
    price: number;
};

export type CoinMarketCapCoin = {
    id: number;
    name: string;
    symbol: string;
    quote: Record<string, CoinMarketCapQuote>;
};

export type CoinMarketCapResponse = {
    data: Record<string, CoinMarketCapCoin>;
};
