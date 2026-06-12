FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy application source
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=/data/database.sqlite

# Create directory for persistent data
RUN mkdir -p /data && chown -R node:node /data

USER node

EXPOSE 5000

# Start server
CMD ["npm", "start"]
