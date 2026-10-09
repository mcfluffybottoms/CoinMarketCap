import { CryptoClient } from '../clients/client';
import { MappingIdToApiRepository } from '../repositories/id-mapping.repository';
import { PriceRepository } from '../repositories/price.repository';
import { CoinPrice } from '../types/client';
import { PriceHistory } from '../types/price';

export class PriceService {
    constructor(
        private readonly repository: PriceRepository,
        private readonly client: CryptoClient,
    ) {}

    async refreshPrice(cryptoId: number): Promise<PriceHistory> {
        const price = await this.client.getPrice(cryptoId);

        if (!Number.isFinite(price) || price <= 0) {
            throw new Error('Price client returned an invalid price');
        }

        return this.repository.create({
            cryptocurrencyId: cryptoId,
            price,
            fetched_at: new Date().toISOString(),
        });
    }

    async refreshPrices(cryptoIds: { id: number }[]): Promise<PriceHistory[]> {
        console.log(cryptoIds);
        const prices = await this.client.getPrices(cryptoIds);
        const fetched_at = new Date().toISOString();
        const cryptosToUpdate = prices.map((item: CoinPrice) => {
            return {
                cryptocurrencyId: item.id,
                price: item.price,
                fetched_at,
            };
        });

        return this.repository.createSeveral(cryptosToUpdate);
    }

    async getLatestPrice(cryptoId: number): Promise<PriceHistory | null> {
        return this.repository.findLatestByCryptoId(cryptoId);
    }

    async getPriceHistory(cryptoId: number): Promise<PriceHistory[]> {
        return this.repository.findHistoryByCryptoId(cryptoId);
    }
}
