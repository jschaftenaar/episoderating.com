FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV CACHE_DIR=/app/cache
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/config ./config
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json
RUN mkdir -p /app/cache
EXPOSE 8080
CMD ["npm", "start"]
