# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN node -v && npm -v && \
    if [ -f tsconfig.json ]; then \
        npx tsc --noEmit || true; \
    else \
        echo "\u26A0\uFE0F tsconfig.json not found. Skipping type check."; \
    fi

COPY . .

RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:1.21-alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost/ || exit 1

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
