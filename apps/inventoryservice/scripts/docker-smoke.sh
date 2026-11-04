#!/usr/bin/env bash
# Builds the production image and boots it the way the platform's deploy
# agent does: a one-off `node migrate.js` container, then the app container
# with the same Docker healthcheck (`wget … /api/health`). Passes when the
# container turns healthy and `/` renders with OAuth off (no OAuth env set);
# cleans everything up on exit.
#
# Needs Docker and the local dev Postgres (`npm run docker:dev` at the coral
# repo root). Migrations run against a throwaway database, never your dev DB.
#
# Knobs (env): SMOKE_DB_CONTAINER, SMOKE_NETWORK, SMOKE_DB_USER,
# SMOKE_DB_PASSWORD, SMOKE_HEALTH_TIMEOUT_SECONDS, SMOKE_KEEP_IMAGE=1.
set -euo pipefail

DB_CONTAINER="${SMOKE_DB_CONTAINER:-custom-apps-postgres-dev}"
NETWORK="${SMOKE_NETWORK:-custom-apps-traefik}"
DB_USER="${SMOKE_DB_USER:-root}"
DB_PASSWORD="${SMOKE_DB_PASSWORD:-root}"
HEALTH_TIMEOUT_SECONDS="${SMOKE_HEALTH_TIMEOUT_SECONDS:-90}"
APP_PORT=3000

RUN_ID="$(date +%s)-$$"
IMAGE="custom-apps-tenants/template-smoke:smoke-${RUN_ID}"
DB_NAME="template_smoke_${RUN_ID//-/_}"
APP_CONTAINER="template-smoke-app-${RUN_ID}"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"

log() { printf '[docker-smoke] %s\n' "$*"; }

SECRET_FILE=""
cleanup() {
  local status=$?
  # The npm token's temp file goes on every exit path (Ctrl-C, failed build).
  [ -n "$SECRET_FILE" ] && rm -f "$SECRET_FILE"
  if [ "$status" -ne 0 ] && docker container inspect "$APP_CONTAINER" >/dev/null 2>&1; then
    log "app container logs:"
    docker logs --tail 100 "$APP_CONTAINER" 2>&1 || true
  fi
  docker rm -f "$APP_CONTAINER" >/dev/null 2>&1 || true
  docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -qc "DROP DATABASE IF EXISTS \"${DB_NAME}\"" >/dev/null 2>&1 || true
  if [ "${SMOKE_KEEP_IMAGE:-0}" != "1" ]; then
    docker image rm "$IMAGE" >/dev/null 2>&1 || true
  fi
  if [ "$status" -eq 0 ]; then log "PASS"; else log "FAIL (exit $status)"; fi
}
trap cleanup EXIT

if ! docker container inspect -f '{{.State.Running}}' "$DB_CONTAINER" 2>/dev/null | grep -q true; then
  log "Postgres container '$DB_CONTAINER' is not running — start it with 'npm run docker:dev' at the coral repo root."
  exit 1
fi

if [ -z "${NPM_TOKEN:-}" ]; then
  log "NPM_TOKEN is not set — the build needs it for the private @npm-questionpro packages (passed as a BuildKit secret)."
  exit 1
fi

log "building $IMAGE"
# File-based secret (`src=`), same as calcite's build-app.yml: works on every
# BuildKit version. Removed right after the build.
SECRET_FILE="$(mktemp)"
printf '%s' "$NPM_TOKEN" > "$SECRET_FILE"
build_status=0
docker build --secret "id=npm_token,src=${SECRET_FILE}" -t "$IMAGE" "$APP_DIR" || build_status=$?
rm -f "$SECRET_FILE"
[ "$build_status" -eq 0 ] || exit "$build_status"

user="$(docker image inspect -f '{{.Config.User}}' "$IMAGE")"
if [ -z "$user" ] || [ "$user" = "root" ] || [ "$user" = "0" ]; then
  log "image runs as root (Config.User='$user') — the deploy agent refuses it"
  exit 1
fi

log "creating throwaway database $DB_NAME"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -qc "CREATE DATABASE \"${DB_NAME}\""

db_env=(-e "DB_HOST=$DB_CONTAINER" -e "DB_PORT=5432" -e "DB_USER=$DB_USER" -e "DB_PASSWORD=$DB_PASSWORD" -e "DB_NAME=$DB_NAME")

log "running migrations (node migrate.js)"
docker run --rm --network "$NETWORK" "${db_env[@]}" "$IMAGE" node migrate.js

log "starting the app with the deploy agent's healthcheck"
docker run -d --name "$APP_CONTAINER" --network "$NETWORK" "${db_env[@]}" \
  --health-cmd "wget -qO /dev/null http://127.0.0.1:${APP_PORT}/api/health" \
  --health-interval 2s --health-timeout 3s --health-retries 3 \
  "$IMAGE" >/dev/null

deadline=$(( $(date +%s) + HEALTH_TIMEOUT_SECONDS ))
while :; do
  health="$(docker inspect -f '{{.State.Health.Status}}' "$APP_CONTAINER" 2>/dev/null || echo missing)"
  running="$(docker inspect -f '{{.State.Running}}' "$APP_CONTAINER" 2>/dev/null || echo false)"
  if [ "$health" = "healthy" ]; then
    log "app is healthy"
    break
  fi
  if [ "$running" != "true" ]; then
    log "app container exited before becoming healthy"
    exit 1
  fi
  if [ "$(date +%s)" -ge "$deadline" ]; then
    log "app not healthy after ${HEALTH_TIMEOUT_SECONDS}s (last status: $health)"
    exit 1
  fi
  sleep 2
done

# No OAuth env is passed, so QUESTIONPRO_OAUTH_ENABLED is unset and OAuth is
# off: a real page must render (not just /api/health).
log "loading / with OAuth disabled"
if ! docker exec "$APP_CONTAINER" wget -qO /dev/null "http://127.0.0.1:${APP_PORT}/"; then
  log "GET / failed with OAuth disabled"
  docker logs --tail 50 "$APP_CONTAINER" || true
  exit 1
fi
