#!/bin/sh
# Script de build que asegura que las variables NEXT_PUBLIC_* estén disponibles

echo "🔍 Verificando variables de entorno para el build..."
echo "   NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-'NO CONFIGURADA'}"

# Verificar que NEXT_PUBLIC_API_URL esté configurada
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
  echo ""
  echo "⚠️  ⚠️  ⚠️  ADVERTENCIA CRÍTICA ⚠️  ⚠️  ⚠️"
  echo "   NEXT_PUBLIC_API_URL no está configurada durante el build"
  echo "   El frontend usará: http://localhost:8000 (NO FUNCIONARÁ EN PRODUCCIÓN)"
  echo ""
  echo "   SOLUCIÓN:"
  echo "   1. Ve a Render → Tu servicio → Environment"
  echo "   2. Agrega: NEXT_PUBLIC_API_URL=https://agenta-rh.onrender.com"
  echo "   3. Haz un nuevo deploy"
  echo ""
else
  echo "✅ NEXT_PUBLIC_API_URL configurada correctamente"
  echo "   URL del backend: $NEXT_PUBLIC_API_URL"
fi

echo ""
echo "🚀 Iniciando build de Next.js..."
echo ""

# Ejecutar el build de Next.js
# Next.js automáticamente inyectará las variables NEXT_PUBLIC_*
npm run build

echo ""
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
  echo "⚠️  Build completado, pero NEXT_PUBLIC_API_URL no estaba configurada"
  echo "   El frontend NO funcionará correctamente hasta configurar la variable"
else
  echo "✅ Build completado exitosamente con NEXT_PUBLIC_API_URL configurada"
fi

