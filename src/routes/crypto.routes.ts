import { Router } from 'express';
import { CryptoController } from '../controllers/crypto.controller';

export function createCryptoRoutes(controller: CryptoController) {
    const router = Router();

    router.post('/', controller.create);
    router.get('/', controller.findAll);
    router.get('/:id', controller.findById);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    router.delete('/', (_req, res) => {
        res.status(400).json({
            error: 'Invalid ID: ID is required.',
        });
    });
    router.put('/', (_req, res) => {
        res.status(400).json({
            error: 'Invalid ID: ID is required.',
        });
    });

    return router;
}
