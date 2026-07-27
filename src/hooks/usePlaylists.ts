import { useEffect, useState } from 'react';
import { fetchUserPlaylists, type SpotifyPlaylistSummary } from '../spotify/api';

interface UsePlaylistsResult {
  playlists: SpotifyPlaylistSummary[];
  loading: boolean;
  error: string | null;
}

export function usePlaylists(enabled: boolean, currentUserId: string | null): UsePlaylistsResult {
  const [playlists, setPlaylists] = useState<SpotifyPlaylistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !currentUserId) return;
    let cancelled = false;
    setLoading(true);
    fetchUserPlaylists(currentUserId)
      .then((result) => {
        if (!cancelled) {
          setPlaylists(result);
          setError(null);
        }
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
  }, [enabled, currentUserId]);

  return { playlists, loading, error };
}
