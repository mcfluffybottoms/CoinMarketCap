import {
    validateCreateCryptocurrencyInput,
    validateUpdateCryptocurrencyInput,
    validateId,
} from '../src/validators/crypto.validator';
import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';

import { ValidationError } from '../src/errors/errors';

describe('validateCreateCryptocurrencyInput', () => {
    test('should return valid input', () => {
        const input = {
            symbol: 'BTC',
            name: 'Bitcoin',
        };

        const result = validateCreateCryptocurrencyInput(input);

        expect(result).toEqual(input);
    });

    test('should throw ValidationError when input is null', () => {
        expect(() => validateCreateCryptocurrencyInput(null)).toThrow(ValidationError);
        expect(() => validateCreateCryptocurrencyInput(null)).toThrow(
            'Invalid input: Input must be an object.',
        );
    });

    test('should throw ValidationError when input is not an object', () => {
        expect(() => validateCreateCryptocurrencyInput('BTC')).toThrow(ValidationError);
        expect(() => validateCreateCryptocurrencyInput('BTC')).toThrow(
            'Invalid input: Input must be an object.',
        );
    });

    test('should throw ValidationError when symbol is missing', () => {
        expect(() =>
            validateCreateCryptocurrencyInput({
                name: 'Bitcoin',
            }),
        ).toThrow('Invalid input: Symbol is required and must be a string.');
    });

    test('should throw ValidationError when symbol is not a string', () => {
        expect(() =>
            validateCreateCryptocurrencyInput({
                symbol: 123,
                name: 'Bitcoin',
            }),
        ).toThrow(ValidationError);
    });

    test('should throw ValidationError when name is missing', () => {
        expect(() =>
            validateCreateCryptocurrencyInput({
                symbol: 'BTC',
            }),
        ).toThrow('Invalid input: Name is required and must be a string.');
    });

    test('should throw ValidationError when name is not a string', () => {
        expect(() =>
            validateCreateCryptocurrencyInput({
                symbol: 'BTC',
                name: 123,
            }),
        ).toThrow(ValidationError);
    });

    test('should reject empty symbol', () => {
        expect(() =>
            validateCreateCryptocurrencyInput({
                symbol: '',
                name: 'Bitcoin',
            }),
        ).toThrow(ValidationError);
    });

    test('should reject empty name', () => {
        expect(() =>
            validateCreateCryptocurrencyInput({
                symbol: 'BTC',
                name: '',
            }),
        ).toThrow(ValidationError);
    });
});

describe('validateUpdateCryptocurrencyInput', () => {
    test('should return valid input', () => {
        const input = {
            symbol: 'ETH',
            name: 'Ethereum',
        };

        const result = validateUpdateCryptocurrencyInput(input);

        expect(result).toEqual(input);
    });

    test('should throw ValidationError when input is null', () => {
        expect(() => validateUpdateCryptocurrencyInput(null)).toThrow(ValidationError);
    });

    test('should throw ValidationError when input is not an object', () => {
        expect(() => validateUpdateCryptocurrencyInput('ETH')).toThrow(ValidationError);
    });

    test('should throw ValidationError when symbol is missing', () => {
        expect(() =>
            validateUpdateCryptocurrencyInput({
                name: 'Ethereum',
            }),
        ).toThrow('Invalid input: Symbol is required and must be a string.');
    });

    test('should throw ValidationError when symbol is not a string', () => {
        expect(() =>
            validateUpdateCryptocurrencyInput({
                symbol: 123,
                name: 'Ethereum',
            }),
        ).toThrow(ValidationError);
    });

    test('should throw ValidationError when name is missing', () => {
        expect(() =>
            validateUpdateCryptocurrencyInput({
                symbol: 'ETH',
            }),
        ).toThrow('Invalid input: Name is required and must be a string.');
    });

    test('should throw ValidationError when name is not a string', () => {
        expect(() =>
            validateUpdateCryptocurrencyInput({
                symbol: 'ETH',
                name: 123,
            }),
        ).toThrow(ValidationError);
    });
});

describe('validateId', () => {
    test('should return positive integer', () => {
        expect(validateId('1')).toBe(1);
        expect(validateId('123')).toBe(123);
    });

    test('should throw ValidationError when id is empty', () => {
        expect(() => validateId('')).toThrow(ValidationError);
    });

    test('should throw ValidationError when id contains only spaces', () => {
        expect(() => validateId('   ')).toThrow(ValidationError);
    });

    test('should throw ValidationError when id is zero', () => {
        expect(() => validateId('0')).toThrow(ValidationError);
    });

    test('should throw ValidationError when id is negative', () => {
        expect(() => validateId('-1')).toThrow(ValidationError);
    });

    test('should throw ValidationError when id is not a number', () => {
        expect(() => validateId('abc')).toThrow(ValidationError);
    });

    test('should throw ValidationError when id is a decimal', () => {
        expect(() => validateId('1.5')).toThrow(ValidationError);
    });

    test('should throw ValidationError when id contains letters', () => {
        expect(() => validateId('123abc')).toThrow(ValidationError);
    });
});
