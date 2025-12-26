#!/bin/sh
# Migration script for Fly.io release command
# This runs before the new version starts

set -e

echo "Running database migrations..."
cd /app
npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma
echo "Migrations complete!"

