import { Router } from 'express';
import { CryptoController } from '../controllers/crypto.controller';

/**
 * @swagger
 * tags:
 *   name: Cryptocurrency
 *   description: Cryptocurrency management
 */

export function createCryptoRoutes(controller: CryptoController) {
    const router = Router();

    /**
     * @swagger
     * /api/cryptocurrencies:
     *   post:
     *     tags: [Cryptocurrency]
     *     summary: Create a cryptocurrency
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *               - symbol
     *             properties:
     *               name:
     *                 type: string
     *                 example: Bitcoin
     *               symbol:
     *                 type: string
     *                 example: BTC
     *     responses:
     *       201:
     *         description: Cryptocurrency created successfully
     *       400:
     *         description: Invalid request
     */
    router.post('/', controller.create);

    /**
     * @swagger
     * /api/cryptocurrencies/all:
     *   get:
     *     tags: [Cryptocurrency]
     *     summary: Get all cryptocurrencies
     *     responses:
     *       200:
     *         description: List of cryptocurrencies
     */
    router.get('/all', controller.findAll);

    /**
     * @swagger
     * /api/cryptocurrencies:
     *   get:
     *     tags: [Cryptocurrency]
     *     summary: Find cryptocurrencies by ID or symbol
     *     parameters:
     *       - in: query
     *         name: id
     *         required: false
     *         schema:
     *           type: integer
     *         description: Local cryptocurrency ID
     *       - in: query
     *         name: symbol
     *         required: false
     *         schema:
     *           type: string
     *         description: Cryptocurrency symbol, such as BTC
     *     responses:
     *       200:
     *         description: Cryptocurrencies found
     *       400:
     *         description: Invalid search parameters
     *       404:
     *         description: Cryptocurrency not found
     */
    router.get('/', controller.find);

    /**
     * @swagger
     * /api/cryptocurrencies/{id} :
     *   put:
     *     tags: [Cryptocurrency]
     *     summary: Update a cryptocurrency
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Cryptocurrency ID
     *     responses:
     *       200:
     *         description: Cryptocurrency updated
     *       400:
     *         description: Invalid ID
     *       404:
     *         description: Cryptocurrency not found
     */
    router.put('/:id', controller.update);

    /**
     * @swagger
     * /api/cryptocurrencies/{id}:
     *   delete:
     *     tags: [Cryptocurrency]
     *     summary: Delete a cryptocurrency
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Cryptocurrency ID
     *     responses:
     *       200:
     *         description: Cryptocurrency deleted
     *       400:
     *         description: Invalid ID
     *       404:
     *         description: Cryptocurrency not found
     */
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
