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

export async function createApp(db: Database, conf: typeof config): Promise<express.Express> {
    const app = express();

    app.use(express.json());

    if (!conf.apiKey) {
        throw new Error('No API key - quitting.');
    }
    const authHandler = createAuthMiddleware(conf.apiKey);
    app.use(authHandler);

    const cryptoRepository = new CryptoRepositoryImpl(db);
    const priceRepository = new PriceRepositoryImpl(db);
    const cryptoService = new CryptoService(cryptoRepository);
    const cryptoController = new CryptoController(cryptoService);
    const cryptoRoutes = createCryptoRoutes(cryptoController);
    app.use('/api', cryptoRoutes);

    app.use(errorHandler);

    return app;
}
