# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar solo los archivos de dependencias primero (mejor caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar el resto del código y compilar
COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:22-alpine

WORKDIR /app

# Copiar solo lo necesario desde el builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001

# Usuario no root por seguridad
USER node

CMD ["node", "dist/server.js"]