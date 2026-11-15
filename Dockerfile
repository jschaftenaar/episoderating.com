FROM node:26-bookworm-slim AS build
WORKDIR /app
ENV NODE_OPTIONS=--dns-result-order=ipv4first
COPY package.json package-lock.json ./
RUN npm config set registry https://registry.npmjs.org/ \
  && npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && for i in 1 2 3 4 5; do \
       npm ci && break; \
       echo "npm ci failed (attempt $i), retrying..."; \
       sleep $((i * 5)); \
     done \
  && test -d node_modules
COPY . .
RUN npm run build \
  && npm prune --omit=dev

FROM node:26-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV CACHE_DIR=/app/cache
ENV NODE_OPTIONS=--dns-result-order=ipv4first
COPY package.json package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/config ./config
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json
RUN mkdir -p /app/cache
EXPOSE 8080
CMD ["npm", "start"]
