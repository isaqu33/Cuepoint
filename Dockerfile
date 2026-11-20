# Cuepoint — web (SvelteKit) e worker de mídia (FFmpeg + whisper.cpp) numa só base de código.
# Alvos: development | web | worker   (padrão dos demais projetos: dev com bind mount, prod com imagem enxuta)

# ---- desenvolvimento (docker-compose.dev.yml) ----
FROM node:20-alpine AS development
# Fora de /app: a rota /app do produto colidiria com o caminho do disco no Vite dev.
WORKDIR /workspace
RUN apk add --no-cache openssl libc6-compat
ENV PUPPETEER_SKIP_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
EXPOSE 3300
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3300"]

# ---- build: compila web e worker, depois deixa só dependências de produção ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build && npm run build:worker \
 && npm prune --omit=dev && npx prisma generate

# ---- whisper.cpp compilado (versão fixa) ----
FROM node:20-alpine AS whisper-build
RUN apk add --no-cache build-base cmake git
ARG WHISPER_CPP_REF=v1.7.6
RUN git clone --depth 1 --branch ${WHISPER_CPP_REF} https://github.com/ggml-org/whisper.cpp.git /src \
 && cd /src \
 && cmake -B build -DBUILD_SHARED_LIBS=OFF -DWHISPER_BUILD_TESTS=OFF -DCMAKE_BUILD_TYPE=Release \
 && cmake --build build -j --target whisper-cli

# ---- modelo do whisper ----
FROM alpine:3.20 AS whisper-model
ARG WHISPER_MODEL=ggml-base.bin
RUN apk add --no-cache curl \
 && curl -fL -o /${WHISPER_MODEL} https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${WHISPER_MODEL}

# ---- imagem final do web ----
FROM node:20-alpine AS web
WORKDIR /app
ENV NODE_ENV=production PORT=3300 HOST=0.0.0.0
RUN apk add --no-cache openssl libc6-compat && addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/build ./build
COPY --from=builder --chown=app:app /app/prisma ./prisma
COPY --from=builder --chown=app:app /app/package.json ./package.json
USER app
EXPOSE 3300
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:3300/api/health >/dev/null || exit 1
CMD ["node", "build"]

# ---- imagem final do worker: sem porta exposta, usuário sem privilégios ----
FROM node:20-alpine AS worker
WORKDIR /app
ENV NODE_ENV=production \
    WHISPER_BIN=/usr/local/bin/whisper-cli \
    WHISPER_MODEL_PATH=/app/models/ggml-base.bin \
    TRANSCRIPTION_WORKDIR=/app/uploads
RUN apk add --no-cache ffmpeg openssl libc6-compat libstdc++ libgomp \
 && addgroup -S app && adduser -S app -G app \
 && mkdir -p /app/uploads /app/models && chown app:app /app/uploads
COPY --from=whisper-build /src/build/bin/whisper-cli /usr/local/bin/whisper-cli
COPY --from=whisper-model /ggml-base.bin /app/models/ggml-base.bin
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/dist-worker ./dist-worker
COPY --from=builder --chown=app:app /app/prisma ./prisma
COPY --from=builder --chown=app:app /app/package.json ./package.json
USER app
CMD ["node", "dist-worker/index.js"]
