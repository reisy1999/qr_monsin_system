# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

COPY restore-app/package*.json ./
COPY shared ./shared
COPY restore-app/tsconfig.app.json ./
COPY restore-app/src ./src

RUN npm install
RUN node -v && npm -v && npx tsc --project tsconfig.app.json --noEmit

COPY restore-app/. .

RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:1.21-alpine

RUN apk add --no-cache netcat-openbsd

COPY --from=build /app/dist /usr/share/nginx/html

COPY restore-app/nginx.conf /etc/nginx/conf.d/default.conf
COPY restore-app/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost/ || exit 1

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
