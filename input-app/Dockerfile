# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Install frontend dependencies and build
COPY input-app/package*.json ./
COPY shared ./shared
COPY input-app/tsconfig.app.json ./
COPY input-app/src ./src
RUN npm install
RUN node -v && npm -v && npx tsc --project tsconfig.app.json --noEmit
COPY input-app/. .
RUN npm run build

# Build the Express server
WORKDIR /app/server
COPY input-app/server/package*.json ./
RUN npm install
RUN node -v && npm -v && npx tsc --noEmit
COPY input-app/server ./
RUN npm run build

# Stage 2: Run with Node
FROM node:18-alpine
WORKDIR /app

# Copy built frontend
COPY --from=build /app/dist ./dist

# Copy built server and resources
COPY --from=build /app/server/dist ./server/dist

# Place frontend build where the Express server expects it
COPY --from=build /app/dist ./server/dist
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/server/package-lock.json ./server/package-lock.json
COPY --from=build /app/server/keys ./server/keys
COPY --from=build /app/server/templates ./server/templates

WORKDIR /app/server
RUN npm install --omit=dev

ENV PORT=80
EXPOSE 80

COPY input-app/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:$PORT/ || exit 1

WORKDIR /app
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server/dist/index.js"]
