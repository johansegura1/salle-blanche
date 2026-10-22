# Étape 1 : construire, avec tous les outils (sert aussi au service migrate)
FROM node:26-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma/schema.prisma ./prisma/
RUN npm ci
COPY . .
RUN npm run build
RUN mkdir -p /app/db && chown node:node /app/db
USER node

# Étape 2 : exécuter, avec le strict nécessaire
FROM node:26-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --omit=optional --ignore-scripts \
 && npm rebuild better-sqlite3 && npm cache clean --force
COPY --from=build /app/dist ./dist
RUN mkdir -p /app/db && chown node:node /app/db
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]