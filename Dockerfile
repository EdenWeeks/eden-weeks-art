# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Vite bakes VITE_* values from .env.production (public identifiers only)
RUN npx vite build -l error && cp dist/index.html dist/404.html

# Production stage — static hosting, matching robotechy's serve setup
FROM node:22-alpine

WORKDIR /app
RUN npm install -g serve@14.2.6

COPY --from=builder /app/dist ./dist

EXPOSE 80
CMD ["serve", "-s", "dist", "-l", "80"]
