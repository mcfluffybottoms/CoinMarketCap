import { ValidationError } from '../errors/errors';
import { CryptoService } from '../services/crypto.service';
import {
    CreateCryptocurrencyInput,
    Cryptocurrency,
    UpdateCryptocurrencyInput,
} from '../types/crypto';
import {
    validateCreateCryptocurrencyInput,
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
        req: Request<CreateCryptocurrencyInput>,
        res: Response<Cryptocurrency | ErrorResponse>,
    ): Promise<void> => {
        try {
            validateCreateCryptocurrencyInput(req.body);
            const coin = await this.service.create(req.body);
            res.status(201).json(coin);
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({ error: error.message });
                return;
            }
            throw error;
        }
    };

    findAll = async (_: Request, res: Response<Cryptocurrency[]>): Promise<void> => {
        const coins = await this.service.findAll();
        res.status(200).json(coins);
    };

    findById = async (
        req: Request<{ id: string }>,
        res: Response<Cryptocurrency | ErrorResponse>,
    ): Promise<void> => {
        try {
            const id = validateId(req.params.id);
            const coin = await this.service.findById(id);
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
