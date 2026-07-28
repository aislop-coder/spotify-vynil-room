# aislop.codes

A monorepo hosting a homepage plus a growing collection of small apps, all served from one
combined static build under a single Cloudflare Worker.

## Structure

```
apps/
  homepage/     — static homepage, served at the domain root
  vynil-room/   — the Spotify vinyl-shelf player, served at /vynil-room
scripts/
  build.sh      — builds every app and combines them into dist/
```

Adding a new app later: drop a new folder under `apps/` with its own `package.json` and a
`npm run build` that produces a `dist/` folder — `scripts/build.sh` picks it up automatically
and serves it at `/<folder-name>`. `apps/homepage` is the one exception: its files are static
and copied straight to the root of the combined build, not nested under a subpath.

## Local development

Each app runs its own dev server independently — see the README inside each app's folder.
From the repo root, `npm run dev` runs the vinyl-room app's dev server.

## Building for deploy

```bash
npm run build
```

This builds every app and combines them into a single `dist/` — the tree that
`wrangler.jsonc` at the repo root deploys as static assets.
