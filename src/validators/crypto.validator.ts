import { CreateCryptocurrencyInput, UpdateCryptocurrencyInput } from '../types/crypto';
import { ValidationError } from '../errors/errors';

export function validateCreateCryptocurrencyInput(input: unknown): CreateCryptocurrencyInput {
    if (!input || typeof input !== 'object') {
        throw new ValidationError('Invalid input: Input must be an object.');
    }

    const { symbol, name } = input as CreateCryptocurrencyInput;

    if (!symbol || typeof symbol !== 'string') {
        throw new ValidationError('Invalid input: Symbol is required and must be a string.');
    }
    if (!name || typeof name !== 'string') {
        throw new ValidationError('Invalid input: Name is required and must be a string.');
    }

    return { symbol, name };
}

export function validateUpdateCryptocurrencyInput(input: unknown): UpdateCryptocurrencyInput {
    if (!input || typeof input !== 'object') {
        throw new ValidationError('Invalid input: Input must be an object.');
    }

    const { symbol, name } = input as UpdateCryptocurrencyInput;

    if (!symbol || typeof symbol !== 'string') {
        throw new ValidationError('Invalid input: Symbol is required and must be a string.');
    }
    if (!name || typeof name !== 'string') {
        throw new ValidationError('Invalid input: Name is required and must be a string.');
    }

    return { symbol, name };
}

export function validateId(id: string): number {
    if (id.trim().length < 0) {
        throw new ValidationError('Invalid ID: ID is empty.');
    }

    const num = Number(id);

    if (!Number.isInteger(num) || num <= 0) {
        throw new ValidationError('Invalid ID: ID must be a positive number.');
    }

    return num;
}
