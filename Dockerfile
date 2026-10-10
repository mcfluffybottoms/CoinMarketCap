
# BUILD
FROM node:22-alpine AS build

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --omit=dev

# SERVER
FROM node:22-alpine AS server

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/db/migrations ./src/db/migrations

RUN mkdir -p /app/data \
    && chown -R node:node /app/data

# ENV VARS
ENV DATABASE_PATH=/app/data/crypto.db
ENV MIGRATIONS_PATH=/app/src/db/migrations
ENV MIGRATIONS_PATH=/app/src/db/migrations
ENV CMC_API_KEY=""
ENV APP_API_KEY=""

USER node

EXPOSE 3000

CMD ["node", "dist/server.js"]
