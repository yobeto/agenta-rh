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
# Si el build falla, este comando fallará y detendrá el proceso
npm run build

# Verificar que el build se completó correctamente
BUILD_EXIT_CODE=$?
if [ $BUILD_EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ ERROR: El build de Next.js falló con código de salida $BUILD_EXIT_CODE"
  echo "   Revisa los logs anteriores para ver el error específico"
  exit $BUILD_EXIT_CODE
fi

# Verificar que BUILD_ID se generó
if [ ! -f .next/BUILD_ID ]; then
  echo ""
  echo "❌ ERROR: BUILD_ID no se generó después del build"
  echo "   El directorio .next existe pero no contiene BUILD_ID"
  echo "   Contenido de .next:"
  ls -la .next/ || echo "   (no se pudo listar .next)"
  exit 1
fi

echo ""
echo "✅ Build completado exitosamente"
echo "   BUILD_ID: $(cat .next/BUILD_ID)"
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
  echo "⚠️  ADVERTENCIA: NEXT_PUBLIC_API_URL no estaba configurada"
  echo "   El frontend NO funcionará correctamente hasta configurar la variable"
else
  echo "✅ NEXT_PUBLIC_API_URL configurada: $NEXT_PUBLIC_API_URL"
fi

