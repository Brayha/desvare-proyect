#!/bin/bash
set -e

echo "📦 Installing dependencies in admin-dashboard..."
cd admin-dashboard
npm install

echo "🔨 Building admin-dashboard..."
npm run build

echo "✅ Build completed successfully!"
