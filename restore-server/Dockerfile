# Stage 1: build
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install
# Verify Node and npm versions
RUN node -v && npm -v

# Confirm tsconfig.json exists and is readable
RUN test -f tsconfig.json && cat tsconfig.json || (echo "\u274C tsconfig.json not found in restore-server"; exit 1)

# Print the resolved TypeScript configuration
RUN npx tsc --project tsconfig.json --showConfig || (echo "\u274C Invalid tsconfig.json"; exit 1)

# List the files included in compilation
RUN npx tsc --project tsconfig.json --listFiles --noEmit || (echo "\u26A0\uFE0F No files found for compilation"; exit 1)

# Run TypeScript check without emitting files
RUN npx tsc --project tsconfig.json --noEmit || (echo "\u274C TypeScript check failed"; exit 1)
COPY . .
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

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:$PORT/ || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
