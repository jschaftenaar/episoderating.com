FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && for i in 1 2 3 4 5; do \
       npm ci && break; \
       echo "npm ci failed (attempt $i), retrying..."; \
       sleep $((i * 5)); \
     done \
  && test -d node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV CACHE_DIR=/app/cache
COPY package.json package-lock.json* ./
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && for i in 1 2 3 4 5; do \
       npm ci --omit=dev && break; \
       echo "npm ci --omit=dev failed (attempt $i), retrying..."; \
       sleep $((i * 5)); \
     done \
  && test -d node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/config ./config
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json
RUN mkdir -p /app/cache
EXPOSE 8080
CMD ["npm", "start"]
