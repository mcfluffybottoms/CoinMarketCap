export type PriceHistory = {
    id: number;
    cryptocurrencyId: number;
    price: number;
    fetched_at: string;
};

export type CreatePriceHistoryInput = {
    cryptocurrencyId: number;
    price: number;
    fetched_at: string;
};
