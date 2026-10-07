CREATE TABLE IF NOT EXISTS cryptocurrencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    last_updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cryptocurrency_id INTEGER NOT NULL,
    price REAL NOT NULL,
    fetched_at TEXT NOT NULL,
    FOREIGN KEY (cryptocurrency_id)
        REFERENCES cryptocurrencies(id)
        ON DELETE CASCADE
);