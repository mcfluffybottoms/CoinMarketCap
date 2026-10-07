import { logger } from '../utils/logger';

export function errorHandler(err: any, req: any, res: any, next: any) {
    logger.error(err.message || 'Internal Server Error');
    res.status(500).json({ error: 'Internal Server Error' });
}
