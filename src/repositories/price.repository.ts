import { Database } from 'sqlite3';
import { CreatePriceHistoryInput, PriceHistory } from '../types/price';

type PriceHistoryRow = {
    id: number;
    cryptocurrency_id: number;
    price: number;
    fetched_at: string;
};

function mapRow(row: PriceHistoryRow): PriceHistory {
    return {
        id: row.id,
        cryptocurrencyId: row.cryptocurrency_id,
        price: row.price,
        fetched_at: row.fetched_at,
    };
}

export interface PriceRepository {
    create(input: CreatePriceHistoryInput): Promise<PriceHistory>;
    createSeveral(input: CreatePriceHistoryInput[]): Promise<PriceHistory[]>;
    findLatestByCryptoId(cryptoId: number): Promise<PriceHistory | null>;
    findHistoryByCryptoId(cryptocurrencyId: number): Promise<PriceHistory[]>;
}

export class PriceRepositoryImpl implements PriceRepository {
    private db: Database;
    constructor(db: Database) {
        this.db = db;
    }

    create(input: CreatePriceHistoryInput): Promise<PriceHistory> {
        return new Promise(async (resolve, reject) => {
            const { cryptocurrencyId, price, fetched_at } = input;
            const fetchedAtValue = fetched_at ?? new Date().toISOString();

            const query = `INSERT INTO price_history (cryptocurrency_id, price, fetched_at) VALUES (?, ?, ?)`;
            const dbInstance = this.db;
            dbInstance.run(query, [cryptocurrencyId, price, fetchedAtValue], function (err) {
                if (err) {
                    reject(err);
                } else {
                    const newPriceHistory: PriceHistory = {
                        id: this.lastID,
                        cryptocurrencyId,
                        price,
                        fetched_at: fetchedAtValue,
                    };
                    resolve(newPriceHistory);
                }
            });
        });
    }

    async createSeveral(inputs: CreatePriceHistoryInput[]): Promise<PriceHistory[]> {
        const dbInstance = this.db;
        return new Promise<PriceHistory[]>((resolve, reject) => {
            dbInstance.serialize(() => {
                dbInstance.run('BEGIN TRANSACTION', (beginError) => {
                    if (beginError) return reject(beginError);

                    const createdPrices: PriceHistory[] = [];
                    let settled = false;

                    const rollback = (error: Error) => {
                        if (settled) return;
                        settled = true;

                        dbInstance.run('ROLLBACK', (rollbackError) => {
                            if (rollbackError) {
                                reject(
                                    new AggregateError(
                                        [error, rollbackError],
                                        'Update and rollback failed',
                                    ),
                                );
                            }
                            reject(error);
                        });
                    };

                    const commit = () => {
                        dbInstance.run('COMMIT', (commitError) => {
                            if (commitError) {
                                rollback(commitError);
                                return;
                            }

                            settled = true;
                            resolve(createdPrices);
                        });
                    };

                    let index = 0;
                    const insertNext = () => {
                        if (index >= inputs.length) {
                            commit();
                            return;
                        }

                        const { cryptocurrencyId, price, fetched_at } = inputs[index++]!;

                        const queryPrice = `INSERT INTO price_history (cryptocurrency_id, price, fetched_at) VALUES (?, ?, ?)`;
                        const queryUpdateTime = `UPDATE cryptocurrencies SET last_updated_at = ? WHERE id = ?`;

                        dbInstance.run(
                            queryPrice,
                            [cryptocurrencyId, price, fetched_at],
                            function (insertError) {
                                if (insertError) {
                                    rollback(insertError);
                                    return;
                                }

                                const newPriceHistory: PriceHistory = {
                                    id: this.lastID,
                                    cryptocurrencyId,
                                    price,
                                    fetched_at,
                                };

                                dbInstance.run(
                                    queryUpdateTime,
                                    [fetched_at, cryptocurrencyId],
                                    (updateError) => {
                                        if (updateError) {
                                            rollback(updateError);
                                            return;
                                        }
                                        createdPrices.push(newPriceHistory);
                                        insertNext();
                                    },
                                );
                            },
                        );
                    };

                    insertNext();
                });
            });
        });
    }

    findLatestByCryptoId(cryptoId: number): Promise<PriceHistory | null> {
        return new Promise(async (resolve, reject) => {
            const query = `SELECT * FROM price_history WHERE cryptocurrency_id = ?
                ORDER BY fetched_at DESC
                LIMIT 1`;
            const dbInstance = this.db;
            dbInstance.all<PriceHistoryRow>(query, [cryptoId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    if (!rows || rows.length === 0) {
                        resolve(null);
                        return;
                    }
                    resolve(mapRow(rows[0]!));
                }
            });
        });
    }

    findHistoryByCryptoId(cryptocurrencyId: number): Promise<PriceHistory[]> {
        return new Promise(async (resolve, reject) => {
            const query = `SELECT * FROM price_history WHERE cryptocurrency_id = ?`;
            const dbInstance = this.db;
            dbInstance.all<PriceHistoryRow>(query, [cryptocurrencyId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const priceHistories = rows.map(mapRow);
                    resolve(priceHistories);
                }
            });
        });
    }
}

// export const priceRepository = new PriceRepositoryImpl(db);
