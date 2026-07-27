import { useEffect, useState } from 'react';
import { fetchShelfTracks, fetchTopTracks } from '../spotify/api';
import type { SpotifyTrack } from '../types/spotify';

interface ShelfData {
  topTracks: SpotifyTrack[];
  shelfTracks: SpotifyTrack[];
  loading: boolean;
  error: string | null;
}

export function useShelfData(enabled: boolean): ShelfData {
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [shelfTracks, setShelfTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchTopTracks(4), fetchShelfTracks()])
      .then(([top, shelf]) => {
        if (cancelled) return;
        setTopTracks(top);
        setShelfTracks(shelf);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { topTracks, shelfTracks, loading, error };
}
