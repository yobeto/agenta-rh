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

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app ./

EXPOSE 3000

# Render usa $PORT → esto es obligatorio
CMD ["sh", "-c", "npm run start -- -p $PORT"]
