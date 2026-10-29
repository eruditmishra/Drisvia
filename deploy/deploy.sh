#!/usr/bin/env bash
set -Eeuo pipefail

BASE="/opt/drisvia"
ENV_FILE="$BASE/.env.production"
COMPOSE_FILE="$BASE/deploy/compose.production.yml"
WEB_ROOT="/var/www/drisvia"
RELEASES="$WEB_ROOT/releases"
CURRENT="$WEB_ROOT/current"

IMAGE="${1:?Usage: deploy.sh IMAGE SHA}"
SHA="${2:?Usage: deploy.sh IMAGE SHA}"

ARCHIVE="/tmp/drisvia-dist-${SHA}.tar.gz"
RELEASE="$RELEASES/$SHA"
TMP_RELEASE="$RELEASES/.tmp-$SHA"

CURRENT_IMAGE_FILE="$BASE/.current-image"
PREVIOUS_IMAGE_FILE="$BASE/.previous-image"
PREVIOUS_RELEASE_FILE="$BASE/.previous-release"

COMPOSE=(
  docker compose
  -p drisvia
  --env-file "$ENV_FILE"
  -f "$COMPOSE_FILE"
)

mkdir -p "$RELEASES" "$BASE/deploy"

if [[ ! -f "$ENV_FILE" || ! -f "$COMPOSE_FILE" ]]; then
  echo "Missing production environment or Compose file."
  exit 1
fi

if [[ ! -f "$ARCHIVE" ]]; then
  echo "Frontend archive not found: $ARCHIVE"
  exit 1
fi

if [[ ! "$SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Invalid Git SHA."
  exit 1
fi

OLD_IMAGE=""
OLD_RELEASE=""

[[ -f "$CURRENT_IMAGE_FILE" ]] && \
  OLD_IMAGE="$(cat "$CURRENT_IMAGE_FILE")"

if [[ -L "$CURRENT" ]]; then
  OLD_RELEASE="$(readlink -f "$CURRENT")"
fi

# Preserve the last known good release before switching.
if [[ -n "$OLD_IMAGE" ]]; then
  printf '%s\n' "$OLD_IMAGE" > "$PREVIOUS_IMAGE_FILE"
fi

if [[ -n "$OLD_RELEASE" ]]; then
  printf '%s\n' "$OLD_RELEASE" > "$PREVIOUS_RELEASE_FILE"
fi

# Prepare the frontend without modifying the active release.
rm -rf "$TMP_RELEASE"
mkdir -p "$TMP_RELEASE"
tar -xzf "$ARCHIVE" -C "$TMP_RELEASE"

test -s "$TMP_RELEASE/index.html"

if [[ -d "$RELEASE" ]]; then
  rm -rf "$TMP_RELEASE"
else
  mv "$TMP_RELEASE" "$RELEASE"
fi

# Validate production Compose configuration.
"${COMPOSE[@]}" config -q

# Pull the exact backend image before switching traffic.
DRISVIA_IMAGE="$IMAGE" "${COMPOSE[@]}" pull drisvia

# The database must use its existing external volume.
"${COMPOSE[@]}" up -d db

# Switch the frontend atomically.
ln -s "$RELEASE" "$WEB_ROOT/current.next"
mv -Tf "$WEB_ROOT/current.next" "$CURRENT"

restore_previous() {
  echo "Deployment failed. Restoring previous release..."

  if [[ -n "$OLD_RELEASE" && -d "$OLD_RELEASE" ]]; then
    ln -s "$OLD_RELEASE" "$WEB_ROOT/current.rollback"
    mv -Tf "$WEB_ROOT/current.rollback" "$CURRENT"
  fi

  if [[ -n "$OLD_IMAGE" ]]; then
    DRISVIA_IMAGE="$OLD_IMAGE" "${COMPOSE[@]}" up -d drisvia
  else
    "${COMPOSE[@]}" stop drisvia || true
  fi

  echo "Rollback attempt completed. Verify application health."
}

if ! DRISVIA_IMAGE="$IMAGE" "${COMPOSE[@]}" up -d drisvia; then
  restore_previous
  exit 1
fi

# Wait up to 150 seconds for the API to become healthy.
for attempt in $(seq 1 30); do
  if curl -fsS --max-time 5 \
      http://127.0.0.1:3000/health >/dev/null; then
    break
  fi

  if [[ "$attempt" -eq 30 ]]; then
    echo "API health check failed."
    restore_previous
    exit 1
  fi

  sleep 5
done

# Verify that host Nginx serves the new frontend.
if ! curl -fsS --max-time 10 \
    https://drisvia.apnto.com/ >/dev/null; then
  echo "Frontend health check failed."
  restore_previous
  exit 1
fi

printf '%s\n' "$IMAGE" > "$CURRENT_IMAGE_FILE"

rm -f "$ARCHIVE"

echo "Deployment successful: $SHA"
