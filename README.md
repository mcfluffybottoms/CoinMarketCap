# Cryptocurrency Price Tracker API

REST API на TypeScript для управления списком отслеживаемых криптовалют,
получения котировок через CoinMarketCap Pro API и хранения истории цен в
SQLite.

## Возможности

- Bearer-аутентификация для маршрутов `/api/...`.
- CRUD-операции со списком отслеживаемых криптовалют.
- Получение котировок через CoinMarketCap Pro API.
- Хранение текущих и исторических цен в SQLite.
- Получение последней сохранённой цены и истории цен.
- Фоновая синхронизация с настраиваемым интервалом.
- Обработка ошибок CoinMarketCap, включая тайм-ауты и ограничение
  частоты запросов.
- Документация OpenAPI/Swagger UI в режиме разработки.
- Автоматические тесты на Jest и Supertest.

## Технологии

- Node.js 22 и TypeScript
- Express 5
- SQLite (`sqlite3`)
- Axios
- CoinMarketCap Pro API
- Swagger UI и OpenAPI 3.0
- Jest, ts-jest и Supertest
- Prettier
- Docker Compose

## Требования

- Node.js 22 и npm
- API-ключ CoinMarketCap Pro
- Секретный ключ приложения для Bearer-аутентификации
- Docker и Docker Compose --- для запуска в контейнере

## Установка

Клонируйте репозиторий и установите зависимости:

```bash
git clone <repository-url>
cd <project-directory>
npm ci
```

Замените `<repository-url>` и `<project-directory>` на URL репозитория и
имя созданной папки.

## Настройка переменных окружения

Приложение читает секреты из файлов, если заданы `CMC_API_KEY_FILE` или
`APP_API_KEY_FILE`. Если соответствующая переменная `*_FILE` не задана,
используются `CMC_API_KEY` и `APP_API_KEY`.

---

Переменная - Назначение - Значение по умолчанию

---

`PORT` - Порт HTTP-сервера - `3000`

`APP_API_KEY` - Bearer-токен для Не задан; приложение не
доступа к API запустится без ключа

`APP_API_KEY_FILE` - Путь к файлу с незаданным
Bearer-токеном

`CMC_API_KEY` - API-ключ CoinMarketCap;

`CMC_API_KEY_FILE` Путь к файлу с ключом

`CURRENCY` Валюта котировки - `USD`

`CMC_TIMEOUT` Тайм-аут запросов к -`5000 мс`

`UPDATE_TIME` Интервал фоновой -`30000 мс`

`DATABASE_PATH` Путь к файлу SQLite `data/crypto.db`

`ENVIRONMENT` Окружение приложения `development`

---

### Локальный запуск в PowerShell

Для локального запуска в PowerShell задайте переменные в текущей сессии:

```powershell
$env:PORT = "3000"
$env:APP_API_KEY = "replace_with_a_long_random_token"
$env:CMC_API_KEY = "replace_with_your_coinmarketcap_api_key"
```

Приложение не загружает `.env`
самостоятельно: `env_file` в `docker-compose.yml` предназначен для
передачи переменных контейнеру.

## Запуск

Запуск в режиме разработки:

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

После запуска API по умолчанию доступен на `http://localhost:3000`.

### Swagger UI / OpenAPI

Swagger UI подключается только при `ENVIRONMENT=development`. В режиме
разработки откройте:

`http://localhost:{PORT}/docs`

(к примеру, `http://localhost:3000/docs`)

В Docker Compose-конфигурации задано `ENVIRONMENT=production`.

## Docker Compose

Для конфигурации с Docker secrets создайте файлы:

- `secrets/cmc_api_key` --- ключ CoinMarketCap Pro;
- `secrets/app_api_key` --- токен приложения.

Папка `secrets/` должна быть исключена из Git. Не помещайте настоящие
ключи в образ Docker.

В `docker-compose.yml` должны быть объявлены секреты верхнего уровня и
подключены к сервису `api`, например:

```yaml
services:
    api:
        environment:
            CMC_API_KEY_FILE: /run/secrets/cmc_api_key
            APP_API_KEY_FILE: /run/secrets/app_api_key
        secrets:
            - cmc_api_key
            - app_api_key

secrets:
    cmc_api_key:
        file: ./secrets/cmc_api_key
    app_api_key:
        file: ./secrets/app_api_key
```

Перед запуском проверьте, что в `docker-compose.yml` блок `secrets:`
находится именно внутри `services.api`, а также объявлен на верхнем
уровне, как в примере. После настройки выполните:

```bash
docker compose config
docker compose up --build -d
```

Полезные команды:

```bash
docker compose logs --tail=100 api
docker compose stop
docker compose start
docker compose down
```

SQLite-файл хранится в именованном томе `crypto_data`, поэтому данные
сохраняются при пересоздании контейнера. Команда
`docker compose down -v` удалит том и сохранённые в нём данные.

## Аутентификация

Все маршруты `/api/...` защищены Bearer-аутентификацией. Передавайте
значение `APP_API_KEY` в заголовке `Authorization`:

```http
Authorization: Bearer <your-app-api-key>
```

Пример запроса в Bash:

```bash
curl -H "Authorization: Bearer $APP_API_KEY" \
  http://localhost:3000/api/cryptocurrencies/all
```

Пример запроса в PowerShell:

```powershell
curl.exe -H "Authorization: Bearer $env:APP_API_KEY" `
  http://localhost:3000/api/cryptocurrencies/all
```

## API

Базовый URL локального запуска: `http://localhost:3000`.

### Криптовалюты

---

Метод Путь Назначение

---

`POST` `/api/cryptocurrencies` Добавить
криптовалюту

`GET` `/api/cryptocurrencies/all` Получить весь
список

`GET` `/api/cryptocurrencies?id=1` Найти криптовалюту
по локальному ID

`GET` `/api/cryptocurrencies?symbol=BTC&name=Bitcoin` Найти криптовалюту
по символу. Поле имени опционально.

`PUT` `/api/cryptocurrencies/:id` Обновить
криптовалюту -- изменить ей имя и символ. При обновлении сохраняется связь с исходной криптовалютой в CoinMarketCap. Локальное изменение имени или символа не должно изменять внешний идентификатор CoinMarketCap (CMC ID), сохранённый в таблице mapping_table.

`DELETE` `/api/cryptocurrencies/:id` Удалить
криптовалюту

---

Пример добавления криптовалюты:

```bash
curl -X POST http://localhost:3000/api/cryptocurrencies \
  -H "Authorization: Bearer $APP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Bitcoin","symbol":"BTC"}'
```

При добавлении сервис проверяет криптовалюту через CoinMarketCap и
сохраняет соответствие между локальной записью и ID во внешнем API.

### Цены и история

---

Метод Путь Назначение

---

`POST` `/api/cryptocurrencies/:id/price/refresh` Запросить свежую
цену и сохранить
её

`GET` `/api/cryptocurrencies/:id/price` Получить последнюю
сохранённую цену

`GET` `/api/cryptocurrencies/:id/history` Получить историю
сохранённых цен

---

В этих маршрутах `:id` --- локальный ID записи в таблице
`cryptocurrencies`, а не ID CoinMarketCap.

Точные схемы запросов и ответов следует смотреть в Swagger UI и в
OpenAPI-аннотациях маршрутов.

## Хранение данных

По умолчанию SQLite использует файл `data/crypto.db`. При инициализации
выполняется SQL-миграция `001_initial.sql`, создающая таблицы:

- `cryptocurrencies` --- локальный список отслеживаемых криптовалют;
- `price_history` --- сохранённые цены и время их получения;
- `mapping_table` --- соответствие локальных ID криптовалют
  идентификаторам CoinMarketCap.

В Docker путь к базе данных задаётся как `/app/data/crypto.db` и
хранится в томе `crypto_data`.

## Фоновая синхронизация

`PriceSyncJob` периодически обновляет цены отслеживаемых криптовалют с
интервалом `UPDATE_TIME` в миллисекундах. Если предыдущий цикл ещё
выполняется, повторный цикл пропускается. Ошибки синхронизации
записываются в лог.

## Обработка ошибок

В зависимости от ситуации API может возвращать следующие HTTP-статусы:

- `400 Bad Request` --- некорректные параметры или тело запроса;
- `401 Unauthorized` --- отсутствующий или неверный Bearer-токен либо
  ошибка авторизации CoinMarketCap;
- `404 Not Found` --- криптовалюта или цена не найдена;
- `429 Too Many Requests` --- превышен лимит CoinMarketCap;
- `504 Gateway Timeout` --- истёк тайм-аут запроса к CoinMarketCap;
- `500 Internal Server Error` --- внутренняя ошибка приложения.

Фактический статус и сообщение зависят от типа ошибки и обработчика.

## Тестирование

Запуск тестов:

```bash
npm test
```

Скрипт `test` уже запускает Jest с флагом `--runInBand`. В проекте есть
тесты контроллеров, репозиториев, валидаторов, фоновой синхронизации и
клиента CoinMarketCap.

Проверка форматирования:

```bash
npm run format:check
```

Автоматическое форматирование:

```bash
npm run format
```

## Структура проекта

```text
src/
├── app.ts                  # Сборка Express-приложения и middleware
├── server.ts               # Инициализация БД и запуск сервера
├── clients/                # Клиенты CoinMarketCap и mock-клиент
├── config/                 # Конфигурация окружения
├── controllers/            # HTTP-контроллеры
├── db/                     # Подключение к SQLite и SQL-миграции
├── errors/                 # Типы ошибок приложения
├── jobs/                   # Фоновая синхронизация цен
├── middleware/             # Аутентификация и обработка ошибок
├── repositories/           # Доступ к данным
├── routes/                 # HTTP-маршруты и OpenAPI-аннотации
├── services/               # Бизнес-логика
├── types/                  # Типы TypeScript
├── utils/                  # Логирование и утилиты
└── validators/              # Валидация входных данных
scripts/                    # Скрипты сборки
tests/                      # Тесты
```
