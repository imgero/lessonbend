FROM mcr.microsoft.com/playwright:v1.61.1-noble

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Render supplies PORT at runtime and mounts the persistent lesson data disk here.
RUN mkdir -p /data
EXPOSE 10000

CMD ["sh", "-c", "npm run start -- -H 0.0.0.0 -p ${PORT:-10000}"]
