# Cryptocurrency Price Tracker API

REST API на TypeScript для управления списком отслеживаемых криптовалют, получения текущих котировок CoinMarketCap и хранения истории цен в SQLite.

## Возможности

- Bearer token-аутентификация для API-эндпоинтов.
- CRUD-операции со списком отслеживаемых криптовалют.
- Получение актуальных котировок через CoinMarketCap API.
- Хранение цен и временных меток в SQLite.
- Получение последней сохранённой цены и истории цен.
- Компонент фоновой синхронизации с настраиваемым интервалом.
- Обработка ошибок CoinMarketCap, включая тайм-ауты и ограничение частоты запросов.
- Документация API через Swagger UI / OpenAPI.
- Тесты на Jest и Supertest.

## Технологии

- Node.js, TypeScript
- Express 5
- SQLite (`sqlite3`)
- Axios
- CoinMarketCap Pro API
- Swagger UI, `swagger-jsdoc`, OpenAPI 3.0
- Jest, ts-jest, Supertest
- Prettier

## Требования

- Node.js и npm
- API-ключ CoinMarketCap Pro
- Ключ приложения для Bearer-аутентификации

## Установка

```bash
git clone <repository-url>
cd <project-directory>
npm install
```

Переменные окружения можно установить так:

```
$env:PORT="3000"
```

### Переменные окружения

| Переменная      | Назначение                                | Значение по умолчанию                      |
| --------------- | ----------------------------------------- | ------------------------------------------ |
| `PORT`          | Порт HTTP-сервера                         | `3000`                                     |
| `APP_API_KEY`   | Bearer-токен для доступа к API приложения | Нет; приложение не запустится без значения |
| `CMC_API_KEY`   | API-ключ CoinMarketCap Pro                | Нет; требуется для реального клиента       |
| `CURRENCY`      | Валюта котировки                          | `USD`                                      |
| `CMC_TIMEOUT`   | Тайм-аут запросов к CoinMarketCap, мс     | `5000`                                     |
| `UPDATE_TIME`   | Интервал фоновой синхронизации, мс        | `30000`                                    |
| `DATABASE_PATH` | Путь к файлу SQLite                       | `data/crypto.db`                           |
| `DATABASE_PATH` | Флаг окружения                            | `DEVELOPMENT`                              |

## Запуск

Режим разработки с перезапуском при изменениях:

```bash
npm run dev
```

Сборка TypeScript и копирование SQL-миграций:

```bash
npm run build
```

Запуск собранной версии:

```bash
npm start
```

Сервер по умолчанию слушает порт `3000`. Swagger UI доступен по адресу:

```text
http://localhost:3000/docs
```

## Docker

Сборка образа:

```
docker compose up --build -d
```

Запуск сервиса:

```
docker compose start
```

Остановка сервиса:

```
docker compose stop
```

Логи:

```
docker compose logs --tail=100 api
```

## Аутентификация

Все маршруты `/api/...` защищены Bearer-аутентификацией. Передавайте значение `APP_API_KEY` в заголовке `Authorization`:

```http
Authorization: Bearer some-token
```

Пример запроса:

```bash
curl -H "Authorization: Bearer $APP_API_KEY" \
  http://localhost:3000/api/cryptocurrencies/all
```

Swagger UI (`/docs`) доступен без токена.

## API

Базовый URL для локального запуска: `http://localhost:3000`.

### Криптовалюты

| Метод    | Путь                               | Назначение                          |
| -------- | ---------------------------------- | ----------------------------------- |
| `POST`   | `/api/cryptocurrencies`            | Добавить криптовалюту               |
| `GET`    | `/api/cryptocurrencies/all`        | Получить весь список                |
| `GET`    | `/api/cryptocurrencies?id=1`       | Найти криптовалюту по локальному ID |
| `GET`    | `/api/cryptocurrencies?symbol=BTC` | Найти криптовалюту по символу       |
| `PUT`    | `/api/cryptocurrencies/:id`        | Обновить криптовалюту               |
| `DELETE` | `/api/cryptocurrencies/:id`        | Удалить криптовалюту                |

Пример добавления криптовалюты:

```bash
curl -X POST http://localhost:3000/api/cryptocurrencies \
  -H "Authorization: Bearer $APP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Bitcoin","symbol":"BTC"}'
```

При добавлении сервис проверяет данные через клиент CoinMarketCap и связывает локальную запись с идентификатором криптовалюты во внешнем API.

### Цены

| Метод  | Путь                                      | Назначение                           |
| ------ | ----------------------------------------- | ------------------------------------ |
| `POST` | `/api/cryptocurrencies/:id/price/refresh` | Запросить свежую цену и сохранить её |
| `GET`  | `/api/cryptocurrencies/:id/price`         | Получить последнюю сохранённую цену  |
| `GET`  | `/api/cryptocurrencies/:id/history`       | Получить историю сохранённых цен     |

В этих маршрутах `:id` — **локальный ID записи** в таблице `cryptocurrencies`, а не CoinMarketCap ID.

Точные схемы ответов и описания операций доступны в Swagger UI по адресу `/docs`.

## Хранение данных

По умолчанию используется SQLite-файл `data/crypto.db`. При инициализации приложения выполняется SQL-миграция `001_initial.sql`, создающая таблицы:

- `cryptocurrencies` — локальный список отслеживаемых криптовалют.
- `price_history` — сохранённые значения цен и время получения; история удаляется каскадно при удалении криптовалюты.
- `mapping_table` — соответствие локальных ID криптовалют идентификаторам CoinMarketCap.

Папка для файла базы данных создаётся автоматически.

## Фоновая синхронизация

Класс `PriceSyncJob` поддерживает периодический опрос списка отслеживаемых криптовалют и обновление цен с интервалом `UPDATE_TIME` (миллисекунды). Повторный запуск задачи, пока предыдущий цикл ещё выполняется, пропускается; ошибки записываются в лог.

## Обработка ошибок

API возвращает JSON с полем `error` при ошибках. В зависимости от ситуации возможны, в частности:

- `400 Bad Request` — некорректные параметры или тело запроса.
- `401 Unauthorized` — отсутствующий или неверный Bearer-токен; также возможна ошибка авторизации CoinMarketCap.
- `404 Not Found` — криптовалюта или сохранённая цена не найдена.
- `429 Too Many Requests` — лимит CoinMarketCap превышен.
- `504 Gateway Timeout` — истёк тайм-аут запроса к CoinMarketCap.
- `500 Internal Server Error` — необработанная внутренняя ошибка.

## Тестирование

Запуск тестов:

```bash
npm test
```

Тесты запускаются последовательно (`--runInBand`). В проекте есть тесты контроллеров, репозиториев, валидаторов, синхронизации и взаимодействия с CoinMarketCap.

## Структура проекта

```text
src/
├── app.ts                  # Сборка Express-приложения и middleware
├── server.ts               # Инициализация БД и запуск сервера
├── clients/                # Клиенты CoinMarketCap и mock-клиент
├── config/                 # Конфигурация из переменных окружения
├── controllers/             # HTTP-контроллеры
├── db/                     # Подключение к SQLite и миграции
├── errors/                  # Типы ошибок приложения
├── jobs/                    # Фоновая синхронизация цен
├── middleware/              # Аутентификация и обработка ошибок
├── repositories/            # Доступ к данным
├── routes/                  # HTTP-маршруты и OpenAPI-аннотации
├── services/                # Бизнес-логика
├── types/                   # Типы TypeScript
├── utils/                   # Логирование и утилиты
└── validators/              # Валидация входных данных
tests/                       # Автоматические тесты
scripts/                     # Скрипты сборки
```

## Форматирование

Проверить форматирование:

```bash
npm run format:check
```

Автоматически отформатировать файлы:

```bash
npm run format
```
