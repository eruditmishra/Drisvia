#!/usr/bin/env bash
set -Eeuo pipefail

BASE="/opt/drisvia"
WEB_ROOT="/var/www/drisvia"
CURRENT="$WEB_ROOT/current"

ENV_FILE="$BASE/.env.production"
COMPOSE_FILE="$BASE/deploy/compose.production.yml"

CURRENT_IMAGE_FILE="$BASE/.current-image"
PREVIOUS_IMAGE_FILE="$BASE/.previous-image"
PREVIOUS_RELEASE_FILE="$BASE/.previous-release"

COMPOSE=(
  docker compose
  --env-file "$ENV_FILE"
  -f "$COMPOSE_FILE"
)

if [[ ! -s "$PREVIOUS_IMAGE_FILE" ||
      ! -s "$PREVIOUS_RELEASE_FILE" ]]; then
  echo "No previous release is recorded."
  exit 1
fi

OLD_IMAGE="$(cat "$CURRENT_IMAGE_FILE")"
NEW_IMAGE="$(cat "$PREVIOUS_IMAGE_FILE")"
OLD_RELEASE="$(cat "$PREVIOUS_RELEASE_FILE")"

if [[ ! -d "$OLD_RELEASE" ]]; then
  echo "Previous frontend release is missing."
  exit 1
fi

DRISVIA_IMAGE="$NEW_IMAGE" "${COMPOSE[@]}" pull drisvia

ln -s "$OLD_RELEASE" "$WEB_ROOT/current.rollback"
mv -Tf "$WEB_ROOT/current.rollback" "$CURRENT"

if ! DRISVIA_IMAGE="$NEW_IMAGE" "${COMPOSE[@]}" up -d drisvia; then
  echo "Backend rollback failed. Check Docker logs."
  exit 1
fi

healthy=false

for attempt in $(seq 1 30); do
  if curl -fsS --max-time 5 \
      http://127.0.0.1:3000/health >/dev/null; then
    healthy=true
    break
  fi

  sleep 5
done

if [[ "$healthy" != true ]]; then
  echo "Rolled-back API did not become healthy."
  exit 1
fi

printf '%s\n' "$NEW_IMAGE" > "$CURRENT_IMAGE_FILE"
printf '%s\n' "$OLD_IMAGE" > "$PREVIOUS_IMAGE_FILE"

printf '%s\n' "$OLD_RELEASE" > "$PREVIOUS_RELEASE_FILE"

echo "Rollback completed. Verify the public application."
