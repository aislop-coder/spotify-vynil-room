#!/usr/bin/env bash
# Builds every app under apps/ and combines them into one dist/ tree:
#   apps/homepage/*      -> dist/            (static, no build step)
#   apps/<name>/dist/*   -> dist/<name>/     (every other app, built via its own `npm run build`)
#
# Adding a new app later is just: drop a new folder under apps/ with its own package.json
# and `npm run build` producing a dist/ folder — this script picks it up automatically.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Homepage's static files land at the root of dist/.
cp -r "$ROOT_DIR/apps/homepage/." "$DIST_DIR/"

# Every other app gets built and placed at dist/<app-name>/.
for app_dir in "$ROOT_DIR"/apps/*/; do
  app_name="$(basename "$app_dir")"
  if [ "$app_name" = "homepage" ]; then
    continue
  fi

  echo "==> Building $app_name"
  (cd "$app_dir" && npm install && npm run build)

  cp -r "$app_dir/dist" "$DIST_DIR/$app_name"
done

echo "==> Combined build ready at $DIST_DIR"
