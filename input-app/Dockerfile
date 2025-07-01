# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Install frontend dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Build the React frontend
RUN npm run build

# Build the Express server
WORKDIR /app/server
RUN npm install
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

WORKDIR /app
CMD ["node", "server/dist/index.js"]
