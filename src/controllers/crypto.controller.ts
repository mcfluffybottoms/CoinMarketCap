import { ClientError, ValidationError } from '../errors/errors';
import { CryptoService } from '../services/crypto.service';
import {
    CreateCryptocurrencyRequest,
    Cryptocurrency,
    UpdateCryptocurrencyInput,
} from '../types/crypto';
import {
    validateCreateCryptocurrencyRequest,
    validateId,
    validateUpdateCryptocurrencyInput,
} from '../validators/crypto.validator';
import { Request, Response } from 'express';

type ErrorResponse = {
    error: string;
};

export class CryptoController {
    constructor(private readonly service: CryptoService) {}

    create = async (
        req: Request<CreateCryptocurrencyRequest>,
        res: Response<Cryptocurrency[] | ErrorResponse>,
    ): Promise<void> => {
        try {
            validateCreateCryptocurrencyRequest(req.body);
            const coin = await this.service.create(req.body);
            res.status(201).json(coin);
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({ error: error.message });
                return;
            }
            if (error instanceof ClientError) {
                res.status(error.code).json({ error: error.message });
            }
            throw error;
        }
    };

    findAll = async (_: Request, res: Response<Cryptocurrency[]>): Promise<void> => {
        const coins = await this.service.findAll();
        res.status(200).json(coins);
    };

    find = async (
        req: Request<{}, Cryptocurrency[] | ErrorResponse, {}, { id?: string; symbol?: string }>,
        res: Response<Cryptocurrency[] | ErrorResponse>,
    ): Promise<void> => {
        try {
            const { id, symbol } = req.query;
            if (id !== undefined) {
                const coinId = validateId(id);
                const coin = await this.service.findById(coinId);

                if (!coin) {
                    res.status(404).json({ error: 'Cryptocurrency not found' });
                    return;
                }

                if (symbol !== undefined && coin.symbol != symbol) {
                    res.status(400).json({
                        error: 'Cryptocurrency contains a conflict between exclusive peers [id, symbol]',
                    });
                    return;
                }

                res.status(200).json([coin]);
                return;
            }

            if (symbol !== undefined) {
                const normalizedSymbol = symbol.trim().toUpperCase();

                if (!normalizedSymbol) {
                    res.status(400).json({ error: 'Symbol is required' });
                    return;
                }

                const coins = await this.service.findBySymbol(normalizedSymbol);

                if (coins.length === 0) {
                    res.status(404).json({
                        error: 'Cryptocurrency symbol not found',
                    });
                    return;
                }

                res.status(200).json(coins);
                return;
            }

            res.status(400).json({
                error: 'Either id or symbol is required',
            });
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({ error: error.message });
                return;
            }

            throw error;
        }
    };

    update = async (
        req: Request<{ id: string }, {}, UpdateCryptocurrencyInput>,
        res: Response<Cryptocurrency | ErrorResponse>,
    ): Promise<void> => {
        try {
            validateUpdateCryptocurrencyInput(req.body);
            const input = req.body;
            const id = validateId(req.params.id);
            const coin = await this.service.update(id, input);
            if (!coin) {
                res.status(404).json({ error: 'Cryptocurrency not found' });
                return;
            }
            res.status(200).json(coin);
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({ error: error.message });
                return;
            }
            throw error;
        }
    };

    delete = async (
        req: Request<{ id: string }>,
        res: Response<Cryptocurrency | ErrorResponse>,
    ): Promise<void> => {
        try {
            const id = validateId(req.params.id);
            const coin = await this.service.delete(id);
            if (!coin) {
                res.status(404).json({ error: 'Cryptocurrency not found' });
                return;
            }
            res.status(204).end();
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({ error: error.message });
                return;
            }
            throw error;
        }
    };
}
