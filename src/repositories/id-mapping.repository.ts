import { Database } from 'sqlite3';

export class MappingIdToApiRepository {
    constructor(private readonly db: Database) {}
    getApiIdById(cryptoId: number): Promise<number | null> {
        const query = `SELECT cmc_id FROM mapping_table WHERE crypto_id = ?`;
        return new Promise((resolve, reject) => {
            this.db.get<{ cmc_id: number }>(query, [cryptoId], (error, row) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(row?.cmc_id ?? null);
            });
        });
    }

    getApiIdsByIds(ids: number[]): Promise<{ cmc_ids: number[]; mapping: Map<number, number> }> {
        if (ids.length === 0) {
            return Promise.resolve({
                cmc_ids: [],
                mapping: new Map<number, number>(),
            });
        }

        const placeholders = ids.map(() => '?').join(', ');

        const query = `
            SELECT crypto_id, cmc_id
            FROM mapping_table
            WHERE crypto_id IN (${placeholders})
        `;

        return new Promise((resolve, reject) => {
            this.db.all<{ crypto_id: number; cmc_id: number }>(query, ids, (error, rows) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve({
                    cmc_ids: rows.map((row) => row.cmc_id),
                    mapping: new Map(rows.map((row) => [row.cmc_id, row.crypto_id])),
                });
            });
        });
    }

    existsByApiId(cmcId: number): Promise<boolean> {
        const query = `SELECT EXISTS(SELECT 1 FROM mapping_table WHERE cmc_id = ?) AS record_exists`;
        return new Promise((resolve, reject) => {
            this.db.get<{ record_exists: number }>(query, [cmcId], (error, row) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(row?.record_exists === 1);
            });
        });
    }

    save(cryptoId: number, cmcId: number): Promise<void> {
        const query = `INSERT INTO mapping_table (crypto_id, cmc_id, cached_at)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(crypto_id) DO UPDATE SET
            cmc_id = excluded.cmc_id,
            cached_at = datetime('now')
        `;
        return new Promise((resolve, reject) => {
            this.db.run(query, [cryptoId, cmcId], (error) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve();
            });
        });
    }
}
