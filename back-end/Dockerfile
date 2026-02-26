# ============================================================
# Multi-stage Dockerfile para o backend NestJS da Biblioteca
# ============================================================

# ---------------------------
# Stage 1: Build
# ---------------------------
FROM node:20-slim AS builder

WORKDIR /app

# Instala OpenSSL para que o Prisma detecte corretamente a versão 3.x
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Copia manifestos de dependência e schema Prisma
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instala TODAS as dependências (inclusive devDeps para @nestjs/cli)
RUN npm ci

# Gera o Prisma Client a partir do schema
RUN npx prisma generate

# Copia o restante do código-fonte
COPY . .

# Compila o projeto NestJS (nest build -> dist/)
RUN npm run build

# ---------------------------
# Stage 2: Production
# ---------------------------
FROM node:20-slim AS production

WORKDIR /app

# Instala OpenSSL em runtime (exigido pelo Prisma engine binary no Debian slim)
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Copia manifestos e instala apenas dependências de produção
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copia o schema Prisma
COPY prisma ./prisma/

# Copia os binários do Prisma Client gerados no stage builder
# (evita rodar prisma generate sem o CLI disponível nas devDeps)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copia o build compilado do stage anterior
COPY --from=builder /app/dist ./dist

# Porta padrão do NestJS
EXPOSE 3000

# Variáveis de ambiente com valores padrão (sobrescritos pelo docker-compose)
ENV PORT=3000
ENV NODE_ENV=production

# Inicia a aplicação
CMD ["node", "dist/main"]
