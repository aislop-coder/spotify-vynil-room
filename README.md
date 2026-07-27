# Vinyl Shelf Spotify Player — 70s Study

An illustrated 70s study rendered as a static image, with an interactive Spotify
vinyl shelf layered on top as coded DOM elements. The illustration itself is
never modified — every cubby, frame, and record is a positioned overlay driven
by [`src/data/shelfLayout.json`](src/data/shelfLayout.json), a coordinate map
measured directly from the source image's pixels (see "How the layout was
measured" below).

## Setup

```bash
npm install
cp .env.example .env
```

Create a Spotify app at the [developer dashboard](https://developer.spotify.com/dashboard),
add `http://127.0.0.1:5173/callback` as a Redirect URI on the app, and put the
app's Client ID in `.env` as `VITE_SPOTIFY_CLIENT_ID`. Then:

```bash
npm run dev
```

Open the app at **http://127.0.0.1:5173** — not `localhost`, since Spotify's
redirect URI matching requires the exact host you registered.

Without a configured Client ID, the app still runs and shows the shelf
populated with sample records, so the layout and hover/tilt interactions can
be reviewed without a Spotify account.

## What's implemented

- **Scene** (`src/components/Scene.tsx`) — the illustration plus all overlays,
  wrapped in a fixed-aspect-ratio container so everything scales as one unit.
- **Cubby** / **Record** — each of the 16 real open cubbies (4 outer columns ×
  4 rows; the shelf's bottom row is a closed cane-door cabinet in the art, not
  an open cubby, so it's excluded) holds 5–8 upright records with muted
  per-record coloring and a jagged clip-path top edge. Hovering tilts a record
  outward via a `preserve-3d` + `rotateX` + `translateZ` spring transform and
  pops up a card with album art and track name; clicking loads it into Now
  Playing and starts playback if the account has Premium.
- **Frame** / **NowPlayingFrame** — 4 wall frames show the user's top 4 tracks
  (Spotify `/me/top/tracks`, short-term); the center frame above the turntable
  shows what's currently loaded/playing.
- **Spotify auth** (`src/spotify/`) — Authorization Code + PKCE, entirely
  browser-side (no client secret). Shelf tracks are pulled from the live
  queue first, falling back to the user's first playlist, then recently
  played, since a fresh session's queue is usually empty.
- **Web Playback SDK** (`src/hooks/useSpotifyPlayer.ts`) — registers a
  browser playback device for Premium accounts. Non-Premium accounts see a
  clearly-labeled "Open in Spotify" link-out instead of failing silently.

## How the layout was measured

The illustration (`src/assets/room-illustration.png`, 1535×1024px) was
analyzed with a Python/Pillow script that scans brightness profiles across
the shelf to find the wood-divider edges and frame borders precisely, rather
than eyeballing percentages. `shelfLayout.json` stores the result as
`{ id, xPercent, yPercent, widthPercent, heightPercent }` per region — edit
that file directly if a region ever needs nudging; nothing else references
raw coordinates.

## Known limitations

- The Web Playback SDK / real playback and the Spotify OAuth round-trip need
  a real Spotify Client ID and a Premium account to fully exercise — verified
  here up to the point of the redirect and token exchange logic; the visual
  layer (positioning, hover tilt, popups, frame content) was verified against
  mock data in a live dev server.
