import app from './app';
import { config } from './config/env';
import { getDatabase, runMigrations } from './db/database';

const PORT = config.port;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

async function startServer() {
    try {
        const db = getDatabase(process.env.DATABASE_PATH ?? 'data/crypto.db');
        await runMigrations(await db, config.migrationsPath);
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting the server:', error);
        process.exit(1);
    }
}

void startServer();

export default app;
