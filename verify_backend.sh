#!/bin/bash

# Script para verificar el estado del backend en Render
# Uso: ./verify_backend.sh

BACKEND_URL="${BACKEND_URL:-https://agenta-rh.onrender.com}"

echo "🔍 Verificando backend en: $BACKEND_URL"
echo ""

# 1. Verificar endpoint raíz
echo "1️⃣ Verificando endpoint raíz (/)..."
ROOT_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/")
HTTP_CODE=$(echo "$ROOT_RESPONSE" | tail -n1)
BODY=$(echo "$ROOT_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Endpoint raíz: OK (HTTP $HTTP_CODE)"
    echo "   Respuesta: $BODY"
else
    echo "❌ Endpoint raíz: ERROR (HTTP $HTTP_CODE)"
    echo "   Respuesta: $BODY"
fi
echo ""

# 2. Verificar endpoint de salud
echo "2️⃣ Verificando endpoint de salud (/api/health)..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Endpoint de salud: OK (HTTP $HTTP_CODE)"
    echo "   Respuesta: $BODY"
else
    echo "❌ Endpoint de salud: ERROR (HTTP $HTTP_CODE)"
    echo "   Respuesta: $BODY"
fi
echo ""

# 3. Verificar endpoint de login
echo "3️⃣ Verificando endpoint de login (/api/auth/login)..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"Admin@2024!"}')
HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Endpoint de login: OK (HTTP $HTTP_CODE)"
    # Verificar que la respuesta contiene un token
    if echo "$BODY" | grep -q "access_token"; then
        echo "   ✅ Token JWT generado correctamente"
    else
        echo "   ⚠️  Respuesta no contiene token"
    fi
else
    echo "❌ Endpoint de login: ERROR (HTTP $HTTP_CODE)"
    echo "   Respuesta: $BODY"
fi
echo ""

# 4. Verificar tiempo de respuesta
echo "4️⃣ Verificando tiempo de respuesta..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$BACKEND_URL/api/health")
echo "   Tiempo de respuesta: ${RESPONSE_TIME}s"
if (( $(echo "$RESPONSE_TIME < 5.0" | bc -l) )); then
    echo "   ✅ Tiempo de respuesta aceptable"
else
    echo "   ⚠️  Tiempo de respuesta lento (>5s)"
fi
echo ""

# Resumen
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Backend está funcionando correctamente"
    echo "   URL: $BACKEND_URL"
else
    echo "❌ Backend tiene problemas"
    echo "   Revisa los logs en Render"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

