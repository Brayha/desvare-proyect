#!/bin/bash
set -e

echo "📦 Installing dependencies in client-pwa..."
cd client-pwa
npm install

echo "🔨 Building client-pwa..."
npm run build

echo "✅ Build completed successfully!"
