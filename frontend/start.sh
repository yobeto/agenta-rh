#!/bin/sh

# Script de inicio para Next.js en Render
# Maneja el puerto y muestra información de diagnóstico

echo "🚀 Iniciando servidor Next.js..."
echo "📊 Información del entorno:"
echo "   PORT: ${PORT:-'NO DEFINIDO (usando 3000)'}"
echo "   NODE_ENV: ${NODE_ENV:-'NO DEFINIDO'}"
echo "   HOSTNAME: ${HOSTNAME:-'NO DEFINIDO'}"
echo "   NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-'NO CONFIGURADA'}"
echo ""

# Verificar que BUILD_ID existe
if [ ! -f .next/BUILD_ID ]; then
  echo "❌ ERROR: BUILD_ID no existe. El build no se completó correctamente."
  echo "   Contenido de .next:"
  ls -la .next/ 2>&1 || echo "   (directorio .next no existe)"
  exit 1
fi

BUILD_ID=$(cat .next/BUILD_ID)
echo "✅ BUILD_ID encontrado: ${BUILD_ID}"
echo ""

# Establecer puerto (Render proporciona $PORT automáticamente)
SERVER_PORT=${PORT:-3000}

echo "🌐 Iniciando servidor en puerto ${SERVER_PORT}..."
echo ""

# Iniciar Next.js
# Next.js puede usar PORT como variable de entorno o el flag -p
exec npm run start -- -p ${SERVER_PORT}

