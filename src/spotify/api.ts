import { SPOTIFY_API_BASE } from './config';
import { getValidAccessToken } from './auth';
import type { SpotifyTrack, SpotifyUserProfile } from '../types/spotify';

async function spotifyFetchOnce<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Not authenticated with Spotify');

  const res = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const parts: string[] = [];
    const authHeader = res.headers.get('www-authenticate');
    if (authHeader) parts.push(authHeader);
    try {
      const body = await res.clone().json();
      if (body?.error?.message) parts.push(body.error.message);
    } catch {
      // response body wasn't JSON (or was empty)
    }
    throw new Error(`Spotify API ${path} failed: ${res.status}${parts.length ? ` — ${parts.join(' | ')}` : ''}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const RETRY_COUNT = 2;
const RETRY_DELAY_MS = 250;

/**
 * Retries on any failure (network error, non-2xx, or an unparseable body) before giving up.
 * Some browser extensions (security/DLP proxies, etc.) intercept and occasionally mangle
 * fetch responses — a retry recovers cleanly when that interference is intermittent rather
 * than a hard block on every request.
 */
async function spotifyFetch<T>(path: string, init?: RequestInit, attempt = 0): Promise<T> {
  try {
    return await spotifyFetchOnce<T>(path, init);
  } catch (err) {
    if (attempt >= RETRY_COUNT) throw err;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
    return spotifyFetch<T>(path, init, attempt + 1);
  }
}

export async function fetchProfile(): Promise<SpotifyUserProfile> {
  return spotifyFetch<SpotifyUserProfile>('/me');
}

export async function fetchTopTracks(limit = 4): Promise<SpotifyTrack[]> {
  const json = await spotifyFetch<{ items: SpotifyTrack[] }>(
    `/me/top/tracks?time_range=short_term&limit=${limit}`,
  );
  return json.items;
}

interface QueueResponse {
  currently_playing: SpotifyTrack | null;
  queue: SpotifyTrack[];
}

async function fetchQueueTracks(): Promise<SpotifyTrack[]> {
  const json = await spotifyFetch<QueueResponse>('/me/player/queue');
  const tracks = [...(json.currently_playing ? [json.currently_playing] : []), ...json.queue];
  return tracks;
}

async function fetchRecentlyPlayedTracks(limit = 50): Promise<SpotifyTrack[]> {
  const json = await spotifyFetch<{ items: { track: SpotifyTrack }[] }>(
    `/me/player/recently-played?limit=${limit}`,
  );
  return json.items.map((item) => item.track);
}

async function fetchFirstPlaylistTracks(limit = 100): Promise<SpotifyTrack[]> {
  const playlists = await spotifyFetch<{ items: { id: string }[] }>('/me/playlists?limit=1');
  const playlistId = playlists.items[0]?.id;
  if (!playlistId) return [];
  return fetchPlaylistTracks(playlistId, limit);
}

/**
 * Pulls tracks to populate the shelf by default, before the user has picked a
 * playlist from the coffee-table book. Prefers the live queue (what's
 * actually up next), falls back to the user's first playlist, then recently
 * played — a fresh account's queue is usually empty outside of active playback.
 */
export async function fetchShelfTracks(): Promise<SpotifyTrack[]> {
  const sources = [fetchQueueTracks, fetchFirstPlaylistTracks, fetchRecentlyPlayedTracks];
  for (const source of sources) {
    try {
      const tracks = await source();
      if (tracks.length > 0) return tracks;
    } catch {
      // try the next source
    }
  }
  return [];
}

export async function playTrackOnDevice(deviceId: string, trackUri: string): Promise<void> {
  await spotifyFetch(`/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uris: [trackUri] }),
  });
}

export async function pausePlayback(deviceId: string): Promise<void> {
  await spotifyFetch(`/me/player/pause?device_id=${deviceId}`, { method: 'PUT' });
}

export async function resumePlayback(deviceId: string): Promise<void> {
  await spotifyFetch(`/me/player/play?device_id=${deviceId}`, { method: 'PUT' });
}

export async function skipToNext(deviceId: string): Promise<void> {
  await spotifyFetch(`/me/player/next?device_id=${deviceId}`, { method: 'POST' });
}

export async function skipToPrevious(deviceId: string): Promise<void> {
  await spotifyFetch(`/me/player/previous?device_id=${deviceId}`, { method: 'POST' });
}

export async function setPlaybackVolume(deviceId: string, volumePercent: number): Promise<void> {
  const clamped = Math.max(0, Math.min(100, Math.round(volumePercent)));
  await spotifyFetch(`/me/player/volume?volume_percent=${clamped}&device_id=${deviceId}`, {
    method: 'PUT',
  });
}

export interface SpotifyPlaylistSummary {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
}

interface RawPlaylistsPage {
  items: ({
    id: string;
    name: string;
    images: { url: string }[] | null;
    tracks: { total: number } | null;
    items: { total: number } | null;
    owner: { id: string } | null;
    collaborative: boolean;
  } | null)[];
  next: string | null;
}

/** Strips the API origin off a Spotify pagination `next` URL, leaving a path+query fetch() can use. */
function toRelativePath(nextUrl: string): string {
  return nextUrl.replace(SPOTIFY_API_BASE, '');
}

/**
 * Fetches the current user's playlists (paginated), up to a sane cap.
 *
 * Only includes playlists the user owns or collaborates on. Spotify's Web API
 * won't reliably return track listings (or accurate counts) for playlists a
 * user merely *follows* — algorithmic ones like Discover Weekly are the most
 * visible case, but the same 403/empty behavior shows up for other people's
 * private playlists too. Ownership is the one condition that's actually
 * guaranteed readable.
 */
export async function fetchUserPlaylists(
  currentUserId: string,
  maxPlaylists = 100,
): Promise<SpotifyPlaylistSummary[]> {
  const results: SpotifyPlaylistSummary[] = [];
  let path: string | null = `/me/playlists?limit=50`;

  while (path && results.length < maxPlaylists) {
    const page: RawPlaylistsPage = await spotifyFetch<RawPlaylistsPage>(path);
    for (const item of page.items) {
      if (!item?.id) continue;
      const isOwned = item.owner?.id === currentUserId;
      if (!isOwned && !item.collaborative) continue;
      results.push({
        id: item.id,
        name: item.name ?? 'Untitled playlist',
        imageUrl: item.images?.[0]?.url ?? null,
        trackCount: item.tracks?.total ?? item.items?.total ?? 0,
      });
    }
    path = page.next ? toRelativePath(page.next) : null;
  }

  return results;
}

// Spotify's documented schema nests a playlist's tracks under `tracks: { items: [{ track }] }`,
// but at least some accounts get served a different shape with `items: { items: [{ item }] }`
// instead — observed directly from a live response. Support both.
interface RawPlaylistTrackEntry {
  track?: SpotifyTrack | null;
  item?: SpotifyTrack | null;
}

interface RawPlaylistTracksPage {
  items: RawPlaylistTrackEntry[];
  next: string | null;
}

interface RawPlaylistObject {
  tracks?: RawPlaylistTracksPage;
  items?: RawPlaylistTracksPage;
}

function extractTrack(entry: RawPlaylistTrackEntry): SpotifyTrack | null {
  return entry.track ?? entry.item ?? null;
}

/**
 * Fetches a playlist's tracks (paginated), up to a cap since the shelf only has so many slots.
 *
 * Uses `GET /playlists/{id}` (the parent playlist resource, which embeds the first
 * page of tracks) rather than `GET /playlists/{id}/tracks` directly — some apps in
 * Development Mode get a bare 403 on that sub-resource endpoint even for playlists
 * the user owns, while the parent resource's embedded track data still works.
 */
export async function fetchPlaylistTracks(playlistId: string, maxTracks = 300): Promise<SpotifyTrack[]> {
  const results: SpotifyTrack[] = [];

  const playlist = await spotifyFetch<RawPlaylistObject>(`/playlists/${playlistId}`);
  const firstPage = playlist.tracks ?? playlist.items;
  for (const entry of firstPage?.items ?? []) {
    const track = extractTrack(entry);
    if (track) results.push(track);
  }
  let path: string | null = firstPage?.next ? toRelativePath(firstPage.next) : null;

  while (path && results.length < maxTracks) {
    try {
      const page: RawPlaylistTracksPage = await spotifyFetch<RawPlaylistTracksPage>(path);
      for (const entry of page.items) {
        const track = extractTrack(entry);
        if (track) results.push(track);
      }
      path = page.next ? toRelativePath(page.next) : null;
    } catch (err) {
      // A later page can fail even when page one (fetched via the parent object above)
      // doesn't — return what we already have rather than losing the whole playlist.
      console.warn(`Couldn't load further tracks for playlist ${playlistId}`, err);
      break;
    }
  }

  return results.slice(0, maxTracks);
}
