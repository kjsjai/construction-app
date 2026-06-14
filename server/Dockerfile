FROM node:22-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Remove any local DB files that may have been copied (safety net)
RUN rm -rf db/construction.db db/construction.db-shm db/construction.db-wal db/backups

# Environment defaults (overridden by docker-compose / .env)
ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=/data/construction.db

# Create persistent data directory
RUN mkdir -p /data && chown -R node:node /data

USER node

EXPOSE 5000

# --experimental-sqlite is a no-op (harmless) on Node versions where
# node:sqlite is already unflagged, and required on some 22.x builds.
CMD ["node", "--experimental-sqlite", "index.js"]