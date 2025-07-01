# Stage 1: build
FROM node:18-alpine AS build
WORKDIR /app

COPY restore-server/package*.json ./
COPY shared ./shared
COPY restore-server/tsconfig.json ./
COPY restore-server/src ./src
RUN npm install
RUN node -v && npm -v && npx tsc --project tsconfig.json --noEmit || (echo "❌ TypeScript check failed"; exit 1)
COPY restore-server/. .
RUN npm run build

# Stage 2: runtime
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/keys ./keys
RUN npm install --omit=dev

ENV PORT=3000
EXPOSE 3000

COPY restore-server/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:$PORT/ || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
