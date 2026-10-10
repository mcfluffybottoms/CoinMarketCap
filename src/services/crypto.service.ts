import {
    CreateCryptocurrencyRequest,
    Cryptocurrency,
    UpdateCryptocurrencyInput,
} from '../types/crypto';
import { CryptoRepository } from '../repositories/crypto.repository';
import { CryptoClient } from '../clients/client';
import { MappingIdToApiRepository } from '../repositories/id-mapping.repository';
import { PriceService } from './price.service';

export class CryptoService {
    constructor(
        private readonly repository: CryptoRepository,
        private readonly client: CryptoClient,
        private readonly mappingIdToApiRepository: MappingIdToApiRepository,
    ) {}

    async create(input: CreateCryptocurrencyRequest): Promise<Cryptocurrency[]> {
        const coins = await this.client.getCoinInfo(input);

        const addedCoins = (
            await Promise.all(
                coins.map(async (coin) => {
                    if (await this.mappingIdToApiRepository.existsByApiId(coin.apiId)) {
                        return null;
                    }
                    const addedCoin = await this.repository.create({
                        name: coin.record.name,
                        symbol: coin.record.symbol,
                    });
                    await this.mappingIdToApiRepository.save(addedCoin.id, coin.apiId);
                    return addedCoin;
                }),
            )
        ).filter((coin) => coin !== null);
        return addedCoins;
    }

    async findAll(): Promise<Cryptocurrency[]> {
        return this.repository.findAll();
    }

    async findById(id: number): Promise<Cryptocurrency | null> {
        return this.repository.findById(id);
    }

    async findBySymbol(symbol: string): Promise<Cryptocurrency[]> {
        const normalizedSymbol = symbol.trim().toUpperCase();
        return this.repository.findBySymbol(normalizedSymbol);
    }

    async update(id: number, input: UpdateCryptocurrencyInput): Promise<Cryptocurrency | null> {
        return this.repository.update(id, input);
    }

    async delete(id: number): Promise<boolean> {
        return this.repository.delete(id);
    }
}
