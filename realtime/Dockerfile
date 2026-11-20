FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3001
RUN addgroup -S app && adduser -S app -G app
COPY --chown=app:app package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=app:app app.js ./
USER app
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s CMD wget -qO- http://127.0.0.1:3001/health >/dev/null || exit 1
CMD ["node", "app.js"]
