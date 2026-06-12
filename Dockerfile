# --- Build Stage for Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# --- Build Stage for Backend ---
FROM node:20-alpine AS backend-builder
WORKDIR /app/server
COPY server/package*.json ./
# SQLite native bindings require python and build essentials
RUN apk add --no-cache python3 make g++ 
RUN npm install
COPY server/ .

# --- Final Production Image ---
FROM node:20-alpine
WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/server ./server
# Copy frontend build
COPY --from=frontend-builder /app/client/dist ./client/dist

# Install global tools if needed, but concurrently is not needed in prod usually.
# Instead of serving frontend through express or separate server, we can serve it through the express backend
# Ensure backend package.json handles static files or we run them separately.

WORKDIR /app/server
ENV NODE_ENV=production
ENV PORT=3000
# Update the SQLite DB path to point to a volume
ENV DB_PATH=/app/data/construction.db

EXPOSE 3000

# We need a startup script or command
CMD ["npm", "start"]
