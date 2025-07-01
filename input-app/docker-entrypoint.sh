#!/bin/sh
set -e

echo "Starting $(basename "$0")"

echo "Working directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "NODE_ENV: ${NODE_ENV:-development}"

if [ -n "$WAIT_FOR_HOST" ]; then
  HOST=$(echo "$WAIT_FOR_HOST" | cut -d: -f1)
  PORT=$(echo "$WAIT_FOR_HOST" | cut -d: -f2)
  echo "Waiting for $HOST:$PORT"
  while ! nc -z "$HOST" "$PORT"; do
    sleep 1
  done
fi

exec "$@"
