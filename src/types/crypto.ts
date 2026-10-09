export type Cryptocurrency = {
    id: number;
    name: string;
    symbol: string;
    last_updated_at: string;
};

export type CreateCryptocurrencyRequest = {
    symbol: string;
    name: string | undefined;
};

export type CreateCryptocurrencyRecord = {
    symbol: string;
    name: string;
};

export type UpdateCryptocurrencyInput = {
    symbol: string;
    name: string;
};
