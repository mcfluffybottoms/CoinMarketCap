export type Cryptocurrency = {
    id: number;
    name: string;
    symbol: string;
    last_updated_at: string;
};

export type CreateCryptocurrencyInput = {
    symbol: string;
    name: string;
};

export type UpdateCryptocurrencyInput = {
    symbol: string;
    name: string;
};
