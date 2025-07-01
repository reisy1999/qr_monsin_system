# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install
# Verify Node and npm versions
RUN node -v && npm -v

# Confirm tsconfig.json exists and is readable
RUN test -f tsconfig.json && cat tsconfig.json || (echo "\u274C tsconfig.json not found in restore-app"; exit 1)

# Print the resolved TypeScript configuration
RUN npx tsc --project tsconfig.json --showConfig || (echo "\u274C Invalid tsconfig.json"; exit 1)

# List the files included in compilation
RUN npx tsc --project tsconfig.json --listFiles --noEmit || (echo "\u26A0\uFE0F No files found for compilation"; exit 1)

# Run TypeScript check without emitting files
RUN npx tsc --project tsconfig.json --noEmit || (echo "\u274C TypeScript check failed"; exit 1)

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
