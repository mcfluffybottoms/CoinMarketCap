import { Request, Response, NextFunction } from 'express';
import { PriceService } from '../services/price.service';
import { ClientError, ValidationError } from '../errors/errors';
import { validateId } from '../validators/crypto.validator';

export class PriceController {
    constructor(private readonly service: PriceService) {}

    refreshPrice = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        try {
            const cryptoId = validateId(req.params.id);
            const price = await this.service.refreshPrice(cryptoId);
            if (!price) {
                res.status(404).json({ error: 'Coin not found' });
            }
            res.status(201).json(price);
        } catch (error: unknown) {
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

    getLatestPrice = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        try {
            const cryptoId = validateId(req.params.id);
            const price = await this.service.getLatestPrice(cryptoId);

            if (!price) {
                res.status(404).json({
                    error: 'Price history not found for this cryptocurrency',
                });
                return;
            }

            res.status(200).json(price);
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({ error: error.message });
                return;
            }
            throw error;
        }
    };

    getPriceHistory = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        try {
            const cryptoId = validateId(req.params.id);
            const history = await this.service.getPriceHistory(cryptoId);
            res.status(200).json(history);
        } catch (error: unknown) {
            if (error instanceof ValidationError) {
                res.status(400).json({ error: error.message });
                return;
            }

            throw error;
        }
    };
}
