#!/bin/bash
# Script para limpiar y reinstalar dependencias del Frontend Cliente

echo "🧹 Limpiando archivos antiguos..."
cd frontend/FrontendClient

# Eliminar node_modules y archivos de lock
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock
rm -f pnpm-lock.yaml

# Eliminar cache de Astro
rm -rf .astro
rm -rf dist

# Limpiar cache de npm
echo "🗑️ Limpiando cache de npm..."
npm cache clean --force

echo "📦 Instalando dependencias..."
npm install

echo "✅ Limpieza completada. Ahora ejecuta: npm run dev"
