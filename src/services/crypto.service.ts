import {
    CreateCryptocurrencyInput,
    Cryptocurrency,
    UpdateCryptocurrencyInput,
} from '../types/crypto';
import { CryptoRepository } from '../repositories/crypto.repository';

export class CryptoService {
    constructor(private readonly repository: CryptoRepository) {}

    async create(input: CreateCryptocurrencyInput): Promise<Cryptocurrency> {
        return this.repository.create(input);
    }

    async findAll(): Promise<Cryptocurrency[]> {
        return this.repository.findAll();
    }

    async findById(id: number): Promise<Cryptocurrency | null> {
        return this.repository.findById(id);
    }

    async update(id: number, input: UpdateCryptocurrencyInput): Promise<Cryptocurrency | null> {
        return this.repository.update(id, input);
    }

    async delete(id: number): Promise<boolean> {
        return this.repository.delete(id);
    }
}
