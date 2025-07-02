# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

COPY restore-app/package*.json ./
COPY restore-app/tsconfig.json ./
COPY restore-app/tsconfig.app.json ./
COPY restore-app/tsconfig.node.json ./
COPY restore-app/src ./src
COPY shared ./shared
COPY restore-app/index.html ./
COPY restore-app/vite.config.ts ./vite.config.ts
RUN npm install
# Verify Node and npm versions
RUN node -v && npm -v

# Confirm tsconfig.json exists and is readable
RUN test -f tsconfig.json && cat tsconfig.json || (echo "\u274C tsconfig.json not found in restore-app"; exit 1)

# Print the resolved TypeScript configuration


# List the files included in compilation


# Run TypeScript check without emitting files




RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:1.21-alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY restore-app/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost/ || exit 1

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
