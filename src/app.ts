import express from 'express';
import { CryptoRepositoryImpl } from './repositories/crypto.repository';
import { PriceRepositoryImpl } from './repositories/price.repository';
import { CryptoService } from './services/crypto.service';
import { CryptoController } from './controllers/crypto.controller';
import { createCryptoRoutes } from './routes/crypto.routes';
import { Database } from 'sqlite3';
import { errorHandler } from './middleware/error.middleware';
import { config } from './config/env';
import { createAuthMiddleware } from './middleware/auth.middleware';
import { CryptoClient } from './clients/client';
import { MockCryptoClient } from './clients/mock-crypto.client';
import { PriceController } from './controllers/price.controller';
import { createPriceRoutes } from './routes/price.routes';
import { PriceService } from './services/price.service';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { options } from './swagger';
import { PriceSyncJob } from './jobs/price-sync.job';
import { MappingIdToApiRepository } from './repositories/id-mapping.repository';

export async function createApp(db: Database, conf: typeof config, client: CryptoClient) {
    const app = express();

    app.use(express.json());

    if (!conf.apiKey) {
        throw new Error('No API key - quitting.');
    }

    const mappingIdToApiRepository = new MappingIdToApiRepository(db);
    const cryptoRepository = new CryptoRepositoryImpl(db);
    const priceRepository = new PriceRepositoryImpl(db);

    const cryptoService = new CryptoService(cryptoRepository, client, mappingIdToApiRepository);
    const priceService = new PriceService(priceRepository, client, mappingIdToApiRepository);

    const cryptoController = new CryptoController(cryptoService);
    const priceController = new PriceController(priceService);

    const cryptoRoutes = createCryptoRoutes(cryptoController);
    const priceRoutes = createPriceRoutes(priceController);

    const swaggerSpec = swaggerJsdoc(options('http://localhost:3000'));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    const authHandler = createAuthMiddleware(conf.apiKey);

    app.use('/api/cryptocurrencies', authHandler, cryptoRoutes);
    app.use('/api/cryptocurrencies', authHandler, priceRoutes);
    app.use(errorHandler);
    app.use((req, res) => {
        res.status(404).json({
            error: 'Route not found',
            path: req.originalUrl,
        });
    });
    const sync = new PriceSyncJob(priceService, cryptoService, config.updateTime);
    return { app, sync };
}
