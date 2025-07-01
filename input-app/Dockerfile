# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Install frontend dependencies and build
COPY package*.json tsconfig*.json ./
COPY ../shared ./shared
RUN npm install
# Copy sources for type checking
COPY src ./src
RUN node -v && npm -v
RUN ls -al
RUN ls -al shared || echo "\u26A0\uFE0F /app/shared not found"
RUN test -f tsconfig.json && cat tsconfig.json || (echo "\u274C tsconfig.json not found in input-app"; exit 1)

# Print the resolved TypeScript configuration
RUN npx tsc --showConfig || echo "\u26A0\uFE0F tsc config issue"
RUN npx tsc --listFiles --noEmit || echo "\u26A0\uFE0F No files to compile"
RUN npx tsc --project tsconfig.json --showConfig || (echo "\u274C Invalid tsconfig.json"; exit 1)

# List the files included in compilation
RUN npx tsc --project tsconfig.json --listFiles --noEmit || (echo "\u26A0\uFE0F No files found for compilation"; exit 1)

# Run TypeScript check without emitting files
RUN npx tsc --project tsconfig.json --noEmit || (echo "\u274C TypeScript check failed"; exit 1)
COPY . .
RUN npm run build

# Build the Express server
WORKDIR /app/server
COPY server/package*.json server/tsconfig*.json ./
RUN npm install
# Copy server sources for type checking
COPY server/*.ts ./
RUN node -v && npm -v
# Confirm tsconfig.json exists and is readable
RUN test -f tsconfig.json && cat tsconfig.json || (echo "\u274C tsconfig.json not found in input-app server"; exit 1)

# Print the resolved TypeScript configuration
RUN npx tsc --project tsconfig.json --showConfig || (echo "\u274C Invalid tsconfig.json"; exit 1)

# List the files included in compilation
RUN npx tsc --project tsconfig.json --listFiles --noEmit || (echo "\u26A0\uFE0F No files found for compilation"; exit 1)

# Run TypeScript check without emitting files
RUN npx tsc --project tsconfig.json --noEmit || (echo "\u274C TypeScript check failed"; exit 1)
COPY server .
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

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:$PORT/ || exit 1

WORKDIR /app
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server/dist/index.js"]
