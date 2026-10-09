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

export async function createApp(
    db: Database,
    conf: typeof config,
    client: CryptoClient = new MockCryptoClient(),
) {
    const app = express();

    app.use(express.json());

    if (!conf.apiKey) {
        throw new Error('No API key - quitting.');
    }

    const mappingIdToApiRepository = new MappingIdToApiRepository(db);
    const cryptoRepository = new CryptoRepositoryImpl(db);
    const priceRepository = new PriceRepositoryImpl(db);

    const cryptoService = new CryptoService(cryptoRepository, client, mappingIdToApiRepository);
    const priceService = new PriceService(priceRepository, client);

    const cryptoController = new CryptoController(cryptoService);
    const priceController = new PriceController(priceService);

    const cryptoRoutes = createCryptoRoutes(cryptoController);
    const priceRoutes = createPriceRoutes(priceController);

    const swaggerSpec = swaggerJsdoc(options('http://localhost:3000'));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    const authHandler = createAuthMiddleware(conf.apiKey);
    app.use(authHandler);
    app.use('/api/cryptocurrencies', cryptoRoutes);
    app.use('/api/cryptocurrencies', priceRoutes);

    app.use(errorHandler);

    const sync = new PriceSyncJob(priceService, cryptoService, 5000);

    return { app, sync };
}
