# syntax=docker/dockerfile:1

# --- Dependencias de producción ---
FROM node:22-alpine AS dependencias
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# --- Imagen final ---
FROM node:22-alpine
ENV NODE_ENV=production \
    PORT=3001 \
    DB_SSL_CA=/app/certs/global-bundle.pem
WORKDIR /app

# Certificados de Amazon RDS para validar la conexión TLS cuando DB_SSL=true.
ADD --chown=node:node https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /app/certs/global-bundle.pem

COPY --from=dependencias --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

USER node
EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" > /dev/null || exit 1

CMD ["node", "src/server.js"]
