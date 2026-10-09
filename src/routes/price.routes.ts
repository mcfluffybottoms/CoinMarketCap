import { Router } from 'express';
import { PriceController } from '../controllers/price.controller';

/**
 * @swagger
 * tags:
 *   name: Prices
 *   description: Cryptocurrency price and history operations
 */

export function createPriceRoutes(controller: PriceController): Router {
    const router = Router();

    /**
     * @swagger
     * /api/cryptocurrencies/{id}/price/refresh:
     *   post:
     *     tags: [Prices]
     *     summary: Refresh the latest cryptocurrency price
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Cryptocurrency ID
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Price refreshed successfully
     *       400:
     *         description: Invalid cryptocurrency ID
     *       404:
     *         description: Cryptocurrency not found
     *       500:
     *         description: Failed to refresh price
     */
    router.post('/:id/price/refresh', controller.refreshPrice);

    /**
     * @swagger
     * /api/cryptocurrencies/{id}/price:
     *   get:
     *     tags: [Prices]
     *     summary: Get the latest cryptocurrency price
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Cryptocurrency ID
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Latest price retrieved successfully
     *       404:
     *         description: Price or cryptocurrency not found
     *       500:
     *         description: Internal server error
     */
    router.get('/:id/price', controller.getLatestPrice);

    /**
     * @swagger
     * /api/cryptocurrencies/{id}/history:
     *   get:
     *     tags: [Prices]
     *     summary: Get cryptocurrency price history
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Cryptocurrency ID
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Price history retrieved successfully
     *       400:
     *         description: Invalid cryptocurrency ID
     *       404:
     *         description: Cryptocurrency not found
     *       500:
     *         description: Internal server error
     */
    router.get('/:id/history', controller.getPriceHistory);

    return router;
}
