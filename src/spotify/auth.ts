import { generateCodeChallenge, generateCodeVerifier } from './pkce';
import {
  SPOTIFY_AUTH_ENDPOINT,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_REDIRECT_URI,
  SPOTIFY_SCOPES,
  SPOTIFY_TOKEN_ENDPOINT,
  TOKEN_STORAGE_KEY,
  VERIFIER_STORAGE_KEY,
} from './config';
import type { StoredToken } from '../types/spotify';

function readStoredToken(): StoredToken | null {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredToken;
  } catch {
    return null;
  }
}

function writeStoredToken(token: StoredToken) {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function redirectToSpotifyLogin() {
  if (!SPOTIFY_CLIENT_ID) {
    throw new Error('VITE_SPOTIFY_CLIENT_ID is not configured');
  }
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  sessionStorage.setItem(VERIFIER_STORAGE_KEY, verifier);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SPOTIFY_SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });

  window.location.assign(`${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`);
}

async function exchangeCodeForToken(code: string): Promise<StoredToken> {
  const verifier = sessionStorage.getItem(VERIFIER_STORAGE_KEY);
  if (!verifier) throw new Error('Missing PKCE verifier; restart the login flow');

  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID ?? '',
    grant_type: 'authorization_code',
    code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    code_verifier: verifier,
  });

  const res = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const json = await res.json();
  sessionStorage.removeItem(VERIFIER_STORAGE_KEY);
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

async function refreshToken(refresh: string): Promise<StoredToken> {
  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID ?? '',
    grant_type: 'refresh_token',
    refresh_token: refresh,
  });

  const res = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const json = await res.json();
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? refresh,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

/** Call once on app load. If the URL has an OAuth `code`, completes the exchange and cleans the URL. */
export async function completeLoginIfRedirected(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (!code) return;

  const token = await exchangeCodeForToken(code);
  writeStoredToken(token);

  params.delete('code');
  params.delete('state');
  const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
  window.history.replaceState({}, '', cleanUrl);
}

// Spotify rotates (and invalidates) the refresh token on every use in the PKCE flow. Several
// callers can independently notice an expired token around the same moment — the SDK's own
// getOAuthToken callback, plus whatever API calls this page is making — and without this guard
// they'd each fire their own concurrent refresh request using the same (soon-to-be-stale)
// refresh token: only the first one to land succeeds, every other one gets rejected by Spotify
// and clears the stored session, silently breaking playback until the user logs in again.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(stored: StoredToken): Promise<string | null> {
  if (!stored.refreshToken) {
    clearStoredToken();
    return null;
  }
  try {
    const refreshed = await refreshToken(stored.refreshToken);
    writeStoredToken(refreshed);
    return refreshed.accessToken;
  } catch {
    clearStoredToken();
    return null;
  }
}

/** Returns a valid access token, refreshing it if expired. Null if the user isn't logged in. */
export async function getValidAccessToken(): Promise<string | null> {
  const stored = readStoredToken();
  if (!stored) return null;

  if (Date.now() < stored.expiresAt - 60_000) {
    return stored.accessToken;
  }

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken(stored).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export function isLoggedIn(): boolean {
  return readStoredToken() !== null;
}
