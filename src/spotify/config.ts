const ENV_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined;

export const CLIENT_ID_STORAGE_KEY = 'vinyl-shelf.spotify.clientId';

function readStoredClientId(): string | null {
  try {
    return localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredClientId(clientId: string) {
  localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId.trim());
}

export function clearStoredClientId() {
  localStorage.removeItem(CLIENT_ID_STORAGE_KEY);
}

// Spotify caps a single app at 5 users in Development Mode, and getting that lifted now requires
// a registered business with 250k+ monthly users — unreachable for a project like this one. The
// workaround: let each visitor bring their own free Spotify app (their own Client ID), so the
// site isn't bottlenecked by one shared app's user cap. A visitor's own stored ID takes priority
// over the build-time default, which only exists for local development.
export function getSpotifyClientId(): string | undefined {
  return readStoredClientId() ?? ENV_CLIENT_ID;
}

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
