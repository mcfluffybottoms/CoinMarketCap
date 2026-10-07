import { NextFunction, Request, Response } from 'express';

export function createAuthMiddleware(apiKey: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        const auth = req.headers.authorization;

        if (!auth) {
            res.status(401).json({
                error: 'Unauthorized',
            });
            return;
        }

        const [scheme, token] = auth.split(' ');

        if (scheme !== 'Bearer' || !token) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (token !== apiKey) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        next();
    };
}
