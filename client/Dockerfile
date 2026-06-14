FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# This image's only purpose is to hold the build output.
# We extract /app/dist from it using `docker create` + `docker cp` (Phase 3).
FROM scratch AS export
COPY --from=build /app/dist /dist