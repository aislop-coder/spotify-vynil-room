export const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined;

// import.meta.env.BASE_URL reflects Vite's `base` config (e.g. '/vynil-room/' when this app
// is deployed under a subpath rather than a domain's root) — deriving the fallback from it
// means the redirect URI is correct either way without needing an explicit env var.
export const SPOTIFY_REDIRECT_URI =
  (import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string | undefined) ??
  `${window.location.origin}${import.meta.env.BASE_URL}callback`;

export const SPOTIFY_SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-read-recently-played',
];

export const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
export const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
export const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export const TOKEN_STORAGE_KEY = 'vinyl-shelf.spotify.token';
export const VERIFIER_STORAGE_KEY = 'vinyl-shelf.spotify.verifier';
