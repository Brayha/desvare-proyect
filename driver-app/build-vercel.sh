#!/bin/bash

# Script de build para Vercel que instala dependencias de shared
echo "🔧 Installing shared dependencies..."
cd ../shared && npm install

echo "🔧 Installing driver-app dependencies..."
cd ../driver-app && npm install

echo "🏗️ Building driver-app..."
npm run build

echo "✅ Build completed!"
