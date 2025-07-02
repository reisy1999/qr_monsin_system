# Stage 1: build
FROM node:18-alpine AS build
WORKDIR /app

COPY restore-server/package*.json ./
RUN npm install
RUN npm rebuild

COPY restore-server/tsconfig.json ./
COPY restore-server/src ./src

COPY restore-server/keys ./keys
COPY input-app/public/templates ./templates

# Verify Node and npm versions
RUN node -v && npm -v
ENV PATH /app/node_modules/.bin:$PATH

# Confirm tsconfig.json exists and is readable
RUN test -f tsconfig.json && cat tsconfig.json || (echo "\u274C tsconfig.json not found in restore-server"; exit 1)

# Print the resolved TypeScript configuration


# List the files included in compilation


# Run TypeScript check without emitting files


RUN npm run build

# Stage 2: runtime
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/keys ./keys
COPY --from=build /app/templates ./templates
RUN npm install --omit=dev

ENV PORT=3000
EXPOSE 3000

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:$PORT/ || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
