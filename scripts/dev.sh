#!/bin/bash

# Customer UI - Run without Dapr (local development)

echo "Starting Customer UI..."
echo "UI will be available at: http://localhost:3000"
echo ""
echo "Note: Make sure web-bff is running at http://localhost:8014"
echo ""

# Copy .env.http to .env for local development (HTTP mode, no Dapr)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$(dirname "$SCRIPT_DIR")"
if [ -f "$SERVICE_DIR/.env.http" ]; then
    cp "$SERVICE_DIR/.env.http" "$SERVICE_DIR/.env"
    echo "✅ Copied .env.http → .env"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run React development server
npm start
