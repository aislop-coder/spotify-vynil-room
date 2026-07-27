import { useCallback, useState } from 'react';
import { CLIENT_ID_STORAGE_KEY, clearStoredClientId, getSpotifyClientId, setStoredClientId } from '../spotify/config';

interface UseSpotifyClientIdResult {
  clientId: string | undefined;
  /** True only when the active client ID came from a visitor's own input, not the build's default. */
  isOwnClientId: boolean;
  setClientId: (clientId: string) => void;
  clearClientId: () => void;
}

export function useSpotifyClientId(): UseSpotifyClientIdResult {
  const [clientId, setClientIdState] = useState<string | undefined>(() => getSpotifyClientId());
  const [isOwnClientId, setIsOwnClientId] = useState(() => {
    try {
      return localStorage.getItem(CLIENT_ID_STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  });

  const setClientId = useCallback((id: string) => {
    setStoredClientId(id);
    setClientIdState(getSpotifyClientId());
    setIsOwnClientId(true);
  }, []);

  const clearClientId = useCallback(() => {
    clearStoredClientId();
    setClientIdState(getSpotifyClientId());
    setIsOwnClientId(false);
  }, []);

  return { clientId, isOwnClientId, setClientId, clearClientId };
}
