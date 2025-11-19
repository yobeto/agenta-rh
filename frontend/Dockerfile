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

# Hacer el script de build ejecutable
RUN chmod +x ./build.sh

ENV NEXT_TELEMETRY_DISABLED=1

# Usar el script de build que verifica las variables
RUN ./build.sh

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copiar archivos necesarios para producción
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js* ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# Render usa $PORT → esto es obligatorio
CMD ["sh", "-c", "npm run start -- -p $PORT"]
