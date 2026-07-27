import { useEffect, useState } from 'react';
import { clearStoredToken, completeLoginIfRedirected, isLoggedIn, redirectToSpotifyLogin } from '../spotify/auth';
import { fetchProfile } from '../spotify/api';
import type { SpotifyUserProfile } from '../types/spotify';

interface UseAuthResult {
  status: 'loading' | 'logged-out' | 'logged-in';
  profile: SpotifyUserProfile | null;
  isPremium: boolean;
  login: () => void;
  logout: () => void;
}

export function useAuth(): UseAuthResult {
  const [status, setStatus] = useState<'loading' | 'logged-out' | 'logged-in'>('loading');
  const [profile, setProfile] = useState<SpotifyUserProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await completeLoginIfRedirected().catch(() => undefined);
      if (!isLoggedIn()) {
        if (!cancelled) setStatus('logged-out');
        return;
      }
      try {
        const p = await fetchProfile();
        if (!cancelled) {
          setProfile(p);
          setStatus('logged-in');
        }
      } catch {
        if (!cancelled) setStatus('logged-out');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    status,
    profile,
    isPremium: profile?.product === 'premium',
    login: () => {
      redirectToSpotifyLogin().catch((err) => console.error(err));
    },
    logout: () => {
      clearStoredToken();
      setProfile(null);
      setStatus('logged-out');
    },
  };
}
