import { useMemo, useState } from 'react';
import type { SpotifyPlaylistSummary } from '../spotify/api';

const STORAGE_KEY = 'vinyl-shelf.playlist-order';

function readStoredOrder(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * Lets the user pick a custom browsing order for their playlists, persisted
 * locally. Playlists not yet in the stored order (new ones, or before any
 * reordering has happened) fall back to the order the API returned them in,
 * appended after the ones the user has explicitly placed.
 */
export function usePlaylistOrder(playlists: SpotifyPlaylistSummary[]) {
  const [orderIds, setOrderIds] = useState<string[]>(readStoredOrder);

  const orderedPlaylists = useMemo(() => {
    const byId = new Map(playlists.map((p) => [p.id, p]));
    const known = orderIds.map((id) => byId.get(id)).filter((p): p is SpotifyPlaylistSummary => !!p);
    const knownIds = new Set(known.map((p) => p.id));
    const rest = playlists.filter((p) => !knownIds.has(p.id));
    return [...known, ...rest];
  }, [playlists, orderIds]);

  const setOrder = (reordered: SpotifyPlaylistSummary[]) => {
    const ids = reordered.map((p) => p.id);
    setOrderIds(ids);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // localStorage unavailable (private browsing, etc.) — order just won't persist
    }
  };

  return { orderedPlaylists, setOrder };
}
