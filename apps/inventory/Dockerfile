# syntax=docker/dockerfile:1.7
#
# Production image for the platform's deploy pipeline. The build workflow in
# calcite lints this file before building (.github/scripts/check-dockerfile.sh):
# base images must be on the allowlist, the final stage must run as a non-root
# USER, no secret-named ARG/ENV, no ADD from a URL. The deploy agent also
# refuses images that run as root and expects port 3000 + /api/health.

FROM node:24-alpine AS deps
WORKDIR /app
# .npmrc reads ${NPM_TOKEN} for the private @npm-questionpro packages. The token
# arrives as a BuildKit secret (`docker build --secret id=npm_token,src=<file>`;
# `env=` works on modern CLIs only) so it never lands in a layer or the image,
# and `required=true` fails the build if it is missing. The runner stage never
# copies .npmrc.
COPY package.json package-lock.json* .npmrc ./
RUN --mount=type=secret,id=npm_token,required=true \
    NPM_TOKEN="$(cat /run/secrets/npm_token)" && export NPM_TOKEN && \
    if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Ensure `public/` exists so the runner-stage COPY doesn't fail on scaffolds
# that don't ship one. Next.js standalone tolerates an empty public dir.
RUN mkdir -p public && npm run build

FROM node:24-alpine AS python-deps
RUN apk add --no-cache python3 py3-pip
WORKDIR /backend
COPY backend/pyproject.toml ./
COPY backend/app ./app
RUN python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir .

FROM node:24-alpine AS runner
WORKDIR /app
RUN apk add --no-cache python3
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV FASTAPI_URL=http://127.0.0.1:8000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# migrate.js runs as a one-off container before each deploy. Next's standalone
# trace only keeps the drizzle-orm files the server imports (not the
# migrator), so ship the whole package; pg is already traced via db/index.ts.
COPY --from=builder --chown=node:node /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=builder --chown=node:node /app/drizzle/migrations ./drizzle/migrations
COPY --from=builder --chown=node:node /app/migrate.js ./migrate.js
COPY --from=python-deps --chown=node:node /opt/venv /opt/venv
COPY --chown=node:node backend/app ./backend/app
COPY --chown=node:node start.mjs ./start.mjs
USER node
EXPOSE 3000
CMD ["node", "start.mjs"]
