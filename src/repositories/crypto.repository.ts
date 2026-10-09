import { Database } from 'sqlite3';
import {
    CreateCryptocurrencyRecord,
    Cryptocurrency,
    UpdateCryptocurrencyInput,
} from '../types/crypto';

type CryptoRow = {
    id: number;
    symbol: string;
    name: string;
    last_updated_at: string;
};

function mapRow(row: CryptoRow): Cryptocurrency {
    return {
        id: row.id,
        symbol: row.symbol,
        name: row.name,
        last_updated_at: row.last_updated_at,
    };
}

export interface CryptoRepository {
    create(input: CreateCryptocurrencyRecord): Promise<Cryptocurrency>;
    update(id: number, input: UpdateCryptocurrencyInput): Promise<Cryptocurrency | null>;
    delete(id: number): Promise<boolean>;
    findById(id: number): Promise<Cryptocurrency | null>;
    findAll(): Promise<Cryptocurrency[]>;
    findBySymbol(symbol: string): Promise<Cryptocurrency[]>;
}

export class CryptoRepositoryImpl implements CryptoRepository {
    private db: Database;
    constructor(db: Database) {
        this.db = db;
    }

    async create(input: CreateCryptocurrencyRecord): Promise<Cryptocurrency> {
        return new Promise(async (resolve, reject) => {
            const { symbol, name } = input;
            const last_updated_at = new Date().toISOString();

            const query = `INSERT INTO cryptocurrencies (symbol, name, last_updated_at) VALUES (?, ?, ?)`;
            const dbInstance = this.db;
            dbInstance.run(query, [symbol, name, last_updated_at], function (err) {
                if (err) {
                    reject(err);
                } else {
                    const newCrypto: Cryptocurrency = {
                        id: this.lastID,
                        symbol,
                        name,
                        last_updated_at,
                    };
                    resolve(newCrypto);
                }
            });
        });
    }

    async update(id: number, input: UpdateCryptocurrencyInput): Promise<Cryptocurrency | null> {
        return new Promise(async (resolve, reject) => {
            const { symbol, name } = input;
            const last_updated_at = new Date().toISOString();
            const dbInstance = this.db;
            const query = `UPDATE cryptocurrencies SET symbol = ?, name = ?, last_updated_at = ? WHERE id = ?`;
            dbInstance.run(query, [symbol, name, last_updated_at, id], function (err) {
                if (err) {
                    reject(err);
                }
                if (this.changes === 0) {
                    resolve(null);
                    return;
                }
                const updatedCrypto: Cryptocurrency = {
                    id,
                    symbol,
                    name,
                    last_updated_at,
                };
                resolve(updatedCrypto);
            });
        });
    }

    async delete(id: number): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            const dbInstance = this.db;
            const query = `DELETE FROM cryptocurrencies WHERE id = ?`;
            dbInstance.run(query, [id], function (err) {
                if (err) {
                    reject(err);
                } else if (this.changes === 0) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    async findById(id: number): Promise<Cryptocurrency | null> {
        return new Promise(async (resolve, reject) => {
            const dbInstance = this.db;
            const query = `SELECT * FROM cryptocurrencies WHERE id = ?`;
            dbInstance.get(query, [id], (err, row: CryptoRow) => {
                if (err) {
                    reject(err);
                } else {
                    if (row) {
                        resolve(mapRow(row));
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    async findAll(): Promise<Cryptocurrency[]> {
        return new Promise(async (resolve, reject) => {
            const dbInstance = this.db;
            const query = `SELECT * FROM cryptocurrencies`;
            dbInstance.all(query, [], (err, rows: CryptoRow[]) => {
                if (err) {
                    reject(err);
                } else {
                    //console.log(mapRow);
                    resolve(rows.map(mapRow));
                }
            });
        });
    }

    async findBySymbol(symbol: string): Promise<Cryptocurrency[]> {
        return new Promise(async (resolve, reject) => {
            const dbInstance = this.db;
            const query = `SELECT * FROM cryptocurrencies WHERE symbol = ?`;
            dbInstance.all(query, [symbol], (err, rows: CryptoRow[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(mapRow));
                }
            });
        });
    }
}
