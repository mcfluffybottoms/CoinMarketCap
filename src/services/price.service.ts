import { CryptoClient } from '../clients/client';
import { ClientError } from '../errors/errors';
import { MappingIdToApiRepository } from '../repositories/id-mapping.repository';
import { PriceRepository } from '../repositories/price.repository';
import { CoinPrice } from '../types/client';
import { PriceHistory } from '../types/price';

export class PriceService {
    constructor(
        private readonly repository: PriceRepository,
        private readonly client: CryptoClient,
        private readonly MappingIdToApiRepository: MappingIdToApiRepository,
    ) {}

    async refreshPrice(cryptoId: number): Promise<PriceHistory | null> {
        const apiId = await this.MappingIdToApiRepository.getApiIdById(cryptoId);
        if (apiId == null) {
            return null;
        }
        const price = await this.client.getPrice(apiId);
        return this.repository.create({
            cryptocurrencyId: cryptoId,
            price,
            fetched_at: new Date().toISOString(),
        });
    }

    async refreshPrices(cryptoIds: number[]): Promise<PriceHistory[]> {
        const { cmc_ids, mapping } = await this.MappingIdToApiRepository.getApiIdsByIds(cryptoIds);
        const prices = (await this.client.getPrices(cmc_ids)).filter((item) => {
            return item.price != undefined;
        });

        const fetched_at = new Date().toISOString();
        const cryptosToUpdate = prices.map((item: CoinPrice) => {
            return {
                cryptocurrencyId: mapping.get(item.id)!,
                price: item.price!,
                fetched_at,
            };
        });

        const data = await this.repository.createSeveral(cryptosToUpdate);
        return data;
    }

    async getLatestPrice(cryptoId: number): Promise<PriceHistory | null> {
        return this.repository.findLatestByCryptoId(cryptoId);
    }

    async getPriceHistory(cryptoId: number): Promise<PriceHistory[]> {
        return this.repository.findHistoryByCryptoId(cryptoId);
    }
}
