# syntax=docker/dockerfile:1

# Imagem base multi-arch oficial Node.js (ARM/AMD64)
FROM --platform=$BUILDPLATFORM node:20-alpine AS deps

WORKDIR /app

# Copia apenas arquivos essenciais para instalar dependências
COPY package.json package-lock.json ./

# Instala dependências de produção e desenvolvimento
RUN npm ci --ignore-scripts

# Etapa de build: compila o TypeScript
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Compila o projeto (assume saída em dist/)
RUN npm run build

# Etapa final: apenas arquivos necessários para produção
FROM --platform=$TARGETPLATFORM node:20-alpine AS runner

WORKDIR /app

# Variáveis de ambiente seguras (ajuste conforme necessário)
ENV NODE_ENV=production
ENV TZ=America/Sao_Paulo

# Copia apenas dependências de produção
COPY package.json package-lock.json ./
RUN npm ci --only=production --ignore-scripts

# Copia arquivos compilados e configs necessários
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env.example ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/docs ./docs

# Exponha a porta padrão (ajuste se necessário)
EXPOSE 3000

# Entrypoint padrão para produção
CMD ["npm", "run", "start"]

# Instrução para build multi-arch (exemplo):
# docker buildx build --platform linux/amd64,linux/arm64 -t seu-usuario/seu-app:latest .