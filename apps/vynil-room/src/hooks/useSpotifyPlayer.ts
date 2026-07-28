import { useEffect, useRef, useState } from 'react';
import { getValidAccessToken } from '../spotify/auth';
import type { SpotifyPlayerInstance, WebPlaybackState } from '../spotify/webPlaybackTypes';

let sdkLoadPromise: Promise<void> | null = null;

function loadSpotifySdk(): Promise<void> {
  if (sdkLoadPromise) return sdkLoadPromise;
  sdkLoadPromise = new Promise((resolve) => {
    if (window.Spotify) {
      resolve();
      return;
    }
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);
  });
  return sdkLoadPromise;
}

interface UseSpotifyPlayerResult {
  deviceId: string | null;
  playbackState: WebPlaybackState | null;
  ready: boolean;
  error: string | null;
}

/** Loads the Web Playback SDK and connects a "Vinyl Shelf" device. No-ops if `enabled` is false (e.g. non-Premium). */
export function useSpotifyPlayer(enabled: boolean): UseSpotifyPlayerResult {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<WebPlaybackState | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<SpotifyPlayerInstance | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    loadSpotifySdk().then(() => {
      if (cancelled) return;
      const player = new window.Spotify.Player({
        name: '70s Study Vinyl Shelf',
        getOAuthToken: (cb) => {
          getValidAccessToken().then((token) => cb(token ?? ''));
        },
        volume: 0.7,
      });

      player.addListener('ready', (data) => {
        const { device_id } = data as { device_id: string };
        if (!cancelled) {
          setDeviceId(device_id);
          setReady(true);
        }
      });
      player.addListener('not_ready', () => {
        if (!cancelled) setReady(false);
      });
      player.addListener('player_state_changed', (data) => {
        if (!cancelled) setPlaybackState(data as WebPlaybackState | null);
      });
      player.addListener('initialization_error', (data) => {
        const { message } = data as { message: string };
        if (!cancelled) setError(message);
      });
      player.addListener('authentication_error', (data) => {
        const { message } = data as { message: string };
        if (!cancelled) setError(message);
      });
      player.addListener('account_error', (data) => {
        const { message } = data as { message: string };
        if (!cancelled) setError(message);
      });

      player.connect();
      playerRef.current = player;
    });

    return () => {
      cancelled = true;
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, [enabled]);

  return { deviceId, playbackState, ready, error };
}
