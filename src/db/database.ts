import path from 'path';
import fs from 'node:fs';
import sqlite3, { Database } from 'sqlite3';

const sqlite = sqlite3.verbose();

function ensureDatabaseDirectoryExists(databasePath: string): void {
    const dir = path.dirname(databasePath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

export function getDatabase(databasePath: string): Promise<Database> {
    ensureDatabaseDirectoryExists(databasePath);
    return new Promise((resolve, reject) => {
        const database = new sqlite.Database(databasePath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(database);
            }
        });
    });
}

// export const db = getDatabase(process.env.DATABASE_PATH ?? 'data/crypto.db');

export function runMigrations(db: Database, migrationsPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const initial = path.join(migrationsPath, '001_initial.sql');
        fs.readFile(initial, 'utf8', (err, sql) => {
            if (err) {
                reject(err);
                return;
            }
            db.exec('PRAGMA foreign_keys = ON;');
            db.exec(sql, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    });
}

export function closeDatabase(database: Database): Promise<void> {
    return new Promise((resolve, reject) => {
        database.close((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

export async function ClearDatabase(db: Database): Promise<void> {
    const exec = (sql: string): Promise<void> =>
        new Promise((resolve, reject) => {
            db.exec(sql, (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        });

    await exec('DELETE FROM price_history;');
    await exec('DELETE FROM mapping_table;');
    await exec('DELETE FROM cryptocurrencies;');
}
