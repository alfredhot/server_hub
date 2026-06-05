# ---- build stage ----
FROM node:22-slim AS build
WORKDIR /app

# build tools for native deps (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=/app/data/hub.db

# .output bundles the server + traced node_modules (incl. better-sqlite3).
COPY --from=build /app/.output ./.output
# migrations are applied on startup (server/plugins/0.bootstrap.ts).
COPY --from=build /app/drizzle ./drizzle

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
