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

// The redirect lands on the app's own real index.html (import.meta.env.BASE_URL, e.g.
// '/vynil-room/') rather than a fake '/callback' route — this app is a monorepo sibling of
// other apps under the same domain, each served as a static file tree with no server-side
// routing/fallback of its own, so a real on-disk path is what actually works. Nothing about
// completing the login cares what the path is — it only ever reads the ?code= query string.
export const SPOTIFY_REDIRECT_URI =
  (import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string | undefined) ??
  `${window.location.origin}${import.meta.env.BASE_URL}`;

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
