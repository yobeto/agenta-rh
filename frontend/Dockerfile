# Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copiamos solo package.json del frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY frontend ./
COPY --from=deps /app/node_modules ./node_modules

# Asegurar que las variables NEXT_PUBLIC_* estén disponibles durante el build
# Render pasa estas variables automáticamente como variables de entorno
# Las aceptamos como ARG y las convertimos en ENV para que Next.js las vea
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Hacer el script de build ejecutable y ejecutarlo
# Si el build falla, este comando fallará automáticamente
RUN chmod +x ./build.sh && ./build.sh

# Verificar que el build se completó correctamente
RUN echo "🔍 Verificando BUILD_ID..." && \
    if [ ! -f .next/BUILD_ID ]; then \
      echo "❌ ERROR: BUILD_ID no se generó. El build falló." && \
      echo "Contenido de .next:" && \
      ls -la .next/ 2>&1 || true && \
      exit 1; \
    else \
      BUILD_ID_VALUE=$(cat .next/BUILD_ID) && \
      echo "✅ BUILD_ID generado correctamente: ${BUILD_ID_VALUE}" && \
      echo "✅ Verificación completada exitosamente"; \
    fi

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos necesarios para producción con permisos correctos
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js* ./

# Copiar el build completo de Next.js (incluye BUILD_ID)
# El build.sh ya verificó que BUILD_ID existe, así que confiamos en la copia
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Copiar node_modules (Next.js necesita todas las dependencias en runtime)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copiar script de inicio y hacerlo ejecutable (antes de cambiar de usuario)
COPY --from=builder --chown=nextjs:nodejs /app/start.sh ./start.sh
RUN chmod +x ./start.sh

# Cambiar a usuario no-root para ejecutar la aplicación
USER nextjs

EXPOSE 3000

# Render proporciona $PORT automáticamente
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# Render usa $PORT → esto es obligatorio
# Usar el script de inicio que maneja mejor los errores
CMD ["./start.sh"]
