FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production

FROM node:18-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json ./
USER appuser
EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3004/health || exit 1
CMD ["node", "src/index.js"]
