# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY order-service/package*.json ./order-service/
RUN npm ci
RUN cd order-service && npm ci

COPY . .
# Vite bakes VITE_* values from .env.production (public identifiers only)
RUN npx vite build -l error && cp dist/index.html dist/404.html

# Production stage — static frontend via `serve` plus the order service,
# both supervised by the entrypoint (matching robotechy's container).
FROM node:22-alpine

WORKDIR /app
RUN npm install -g serve@14.2.6

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/order-service ./order-service

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Frontend on 80; the order service only makes outbound relay connections.
EXPOSE 80

ENV NODE_ENV=production

ENTRYPOINT ["/docker-entrypoint.sh"]
