import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useShelfData } from './hooks/useShelfData';
import { useSpotifyPlayer } from './hooks/useSpotifyPlayer';
import { usePlaylists } from './hooks/usePlaylists';
import { useSpotifyClientId } from './hooks/useSpotifyClientId';
import {
  fetchPlaylistTracks,
  pausePlayback,
  playTrackOnDevice,
  resumePlayback,
  setPlaybackVolume,
  type SpotifyPlaylistSummary,
} from './spotify/api';
import { MOCK_TOP_TRACKS, MOCK_TRACKS } from './data/mockTracks';
import { Scene } from './components/Scene';
import { PlaylistBook } from './components/PlaylistBook';
import { ConnectionPaper } from './components/ConnectionPaper';
import { getShelfCapacity, getShelfPageCount, getShelfPageTracks, prepareTrackPool } from './components/shelfAllocation';
import type { SpotifyTrack } from './types/spotify';

const DEFAULT_VOLUME = 70;
const VOLUME_STEP = 10;
const BACK_DOUBLE_PRESS_WINDOW_MS = 5000;
const NIGHT_MODE_STORAGE_KEY = 'vinyl-shelf.night-mode';
const CONNECTION_PROMPT_SEEN_KEY = 'vinyl-shelf.connection-prompt-seen';
const HIGHLIGHT_DURATION_MS = 4000;

function readStoredNightMode(): boolean {
  try {
    return localStorage.getItem(NIGHT_MODE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function App() {
  const auth = useAuth();
  const loggedIn = auth.status === 'logged-in';
  const shelf = useShelfData(loggedIn);
  const player = useSpotifyPlayer(loggedIn && auth.isPremium);
  const playlistsData = usePlaylists(loggedIn, auth.profile?.id ?? null);
  const spotifyClientId = useSpotifyClientId();

  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylistSummary | null>(null);
  const [selectedPlaylistTracks, setSelectedPlaylistTracks] = useState<SpotifyTrack[] | null>(null);
  const [selectingPlaylistId, setSelectingPlaylistId] = useState<string | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);
  const [shelfPage, setShelfPage] = useState(0);
  const [isMediaPanelOpen, setIsMediaPanelOpen] = useState(false);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [isNightMode, setIsNightMode] = useState(readStoredNightMode);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isConnectionOpen, setIsConnectionOpen] = useState(false);
  const [highlightedTrackId, setHighlightedTrackId] = useState<string | null>(null);
  const volumeRef = useRef(DEFAULT_VOLUME);
  const previousTrackRef = useRef<SpotifyTrack | null>(null);
  const lastBackPressRef = useRef(0);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Memoized on the playbackState reference itself (which only changes when Spotify actually
  // emits a new player_state_changed event) rather than being rebuilt on every App render —
  // otherwise `nowPlaying`/`handleSkipNext` below would get a new identity on every incidental
  // re-render, resetting the auto-advance timer's countdown before it ever gets to fire.
  const liveTrack = useMemo<SpotifyTrack | null>(() => {
    if (!player.playbackState) return null;
    const state = player.playbackState;
    return {
      id: state.track_window.current_track.id,
      uri: state.track_window.current_track.uri,
      name: state.track_window.current_track.name,
      artists: state.track_window.current_track.artists.map((a, i) => ({
        id: `live-artist-${i}`,
        name: a.name,
      })),
      album: {
        id: state.track_window.current_track.id,
        name: state.track_window.current_track.album.name,
        images: state.track_window.current_track.album.images.map((img) => ({
          url: img.url,
          width: null,
          height: null,
        })),
      },
      duration_ms: state.duration,
    };
  }, [player.playbackState]);

  // `selectedTrack` reflects what we just intentionally chose (every track change — manual skip,
  // poster click, auto-advance — goes through `playTrack`, which sets it immediately). Preferring
  // it over `liveTrack` means art/text update the instant we act, instead of waiting a beat for
  // Spotify's SDK to round-trip and confirm the device actually caught up.
  const nowPlaying = selectedTrack ?? liveTrack;
  const canControlPlayback = loggedIn && auth.isPremium && !!player.deviceId;

  const usingMockData = !loggedIn;
  const rawShelfSource = usingMockData ? MOCK_TRACKS : (selectedPlaylistTracks ?? shelf.shelfTracks);
  const topTracks = usingMockData ? MOCK_TOP_TRACKS : shelf.topTracks;

  // Memoized so its identity stays stable across incidental re-renders (rawShelfSource itself
  // is already stable state) — otherwise handleSkipNext below gets a new identity every render,
  // which would reset the auto-advance timer's countdown before it ever gets to fire.
  const shelfPool = useMemo(() => prepareTrackPool(rawShelfSource), [rawShelfSource]);
  const shelfPageCount = getShelfPageCount(shelfPool.length);
  const clampedShelfPage = Math.min(shelfPage, shelfPageCount - 1);
  const shelfTracks = getShelfPageTracks(shelfPool, clampedShelfPage);

  /** The single source of truth for starting playback of a track — records history for the "go back" gesture. */
  const playTrack = useCallback(
    (track: SpotifyTrack) => {
      previousTrackRef.current = nowPlaying;
      setSelectedTrack(track);
      if (canControlPlayback && player.deviceId) {
        playTrackOnDevice(player.deviceId, track.uri).catch((err) => console.error('Playback failed', err));
      }
    },
    [nowPlaying, canControlPlayback, player.deviceId],
  );

  const handleOpenPlaylistBook = useCallback(() => {
    if (!loggedIn) {
      auth.login();
      return;
    }
    setIsBookOpen(true);
  }, [loggedIn, auth]);

  const handleSelectPlaylist = useCallback(async (playlist: SpotifyPlaylistSummary) => {
    setSelectingPlaylistId(playlist.id);
    setSelectError(null);
    try {
      const tracks = await fetchPlaylistTracks(playlist.id);
      setSelectedPlaylist(playlist);
      setSelectedPlaylistTracks(tracks);
      setShelfPage(0);
      setIsBookOpen(false);
    } catch (err) {
      setSelectError(err instanceof Error ? err.message : String(err));
    } finally {
      setSelectingPlaylistId(null);
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!canControlPlayback || !player.deviceId) return;
    const isPaused = player.playbackState?.paused ?? true;
    const action = isPaused ? resumePlayback : pausePlayback;
    action(player.deviceId).catch((err) => console.error('Playback toggle failed', err));
  }, [canControlPlayback, player.deviceId, player.playbackState]);

  /**
   * Shuffle on: a random track. Shuffle off: the next one alphabetically, wrapping around forever.
   * Deliberately not gated on `canControlPlayback` — the "what track is current" state (and thus
   * what the shelf/Now Playing show) should still advance for non-Premium accounts, same as
   * clicking a record directly does; only the actual device playback call inside `playTrack` is gated.
   */
  const handleSkipNext = useCallback(() => {
    if (shelfPool.length === 0) return;
    const current = nowPlaying;
    let next: SpotifyTrack;
    if (shuffleEnabled) {
      if (shelfPool.length === 1) {
        next = shelfPool[0];
      } else {
        do {
          next = shelfPool[Math.floor(Math.random() * shelfPool.length)];
        } while (current && next.id === current.id);
      }
    } else {
      const idx = current ? shelfPool.findIndex((t) => t.id === current.id) : -1;
      next = shelfPool[(idx + 1) % shelfPool.length];
    }
    playTrack(next);
  }, [shelfPool, shuffleEnabled, nowPlaying, playTrack]);

  /** First press restarts the current track; a second press within 5s jumps back to whatever played before it. */
  const handleSkipPrevious = useCallback(() => {
    const now = Date.now();
    const withinDoublePress = now - lastBackPressRef.current < BACK_DOUBLE_PRESS_WINDOW_MS;
    lastBackPressRef.current = now;

    if (withinDoublePress && previousTrackRef.current) {
      playTrack(previousTrackRef.current);
      return;
    }

    const current = nowPlaying;
    if (current && canControlPlayback && player.deviceId) {
      playTrackOnDevice(player.deviceId, current.uri).catch((err) => console.error('Restart failed', err));
    }
  }, [canControlPlayback, player.deviceId, nowPlaying, playTrack]);

  // Auto-advance when a track finishes on its own. Spotify's SDK has no reliable "ended"
  // event for single-URI (no context) playback, so instead we arm a timer for exactly how
  // long is left in the track; it re-arms on every state change (play/pause/seek/track
  // change) and fires the skip once the remaining time elapses.
  useEffect(() => {
    const state = player.playbackState;
    if (!state || state.paused || state.duration <= 0) return;
    const remaining = state.duration - state.position;
    if (remaining <= 0) return;
    const timeout = setTimeout(handleSkipNext, remaining + 300);
    return () => clearTimeout(timeout);
  }, [player.playbackState, handleSkipNext]);

  // Fallback for whenever there's no live Web Playback SDK state to drive the timer above —
  // no Premium/device on this account, or the SDK hasn't connected yet. There's no real audio
  // to watch end in that mode, so we simulate it off the track's own known duration instead,
  // re-arming every time a new track becomes current.
  useEffect(() => {
    if (player.playbackState) return;
    if (!nowPlaying || nowPlaying.duration_ms <= 0) return;
    const timeout = setTimeout(handleSkipNext, nowPlaying.duration_ms);
    return () => clearTimeout(timeout);
  }, [nowPlaying, player.playbackState, handleSkipNext]);

  // Surface the Connection paper once per visitor, the first time they show up logged out —
  // otherwise the 🔌 icon is easy to miss and they'd never discover they can bring their own
  // Spotify app instead of being capped by a shared app's 5-user Development Mode limit.
  useEffect(() => {
    if (auth.status !== 'logged-out') return;
    try {
      if (localStorage.getItem(CONNECTION_PROMPT_SEEN_KEY) === '1') return;
      localStorage.setItem(CONNECTION_PROMPT_SEEN_KEY, '1');
    } catch {
      // localStorage unavailable — just show it this once without remembering
    }
    setIsConnectionOpen(true);
  }, [auth.status]);

  const handleVolumeChange = useCallback(
    (delta: number) => {
      if (!canControlPlayback || !player.deviceId) return;
      const next = Math.max(0, Math.min(100, volumeRef.current + delta));
      volumeRef.current = next;
      setPlaybackVolume(player.deviceId, next).catch((err) => console.error('Volume change failed', err));
    },
    [canControlPlayback, player.deviceId],
  );

  const handleToggleNightMode = useCallback(() => {
    setIsNightMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(NIGHT_MODE_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // localStorage unavailable — night mode just won't persist
      }
      return next;
    });
  }, []);

  const handleSearchSelect = useCallback(
    (track: SpotifyTrack) => {
      const idx = shelfPool.findIndex((t) => t.id === track.id);
      if (idx >= 0) {
        const capacity = getShelfCapacity();
        const page = Math.floor(idx / capacity);
        setShelfPage(Math.min(shelfPageCount - 1, Math.max(0, page)));
      }
      setHighlightedTrackId(track.id);
      setIsSearchOpen(false);
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = setTimeout(() => setHighlightedTrackId(null), HIGHLIGHT_DURATION_MS);
    },
    [shelfPool, shelfPageCount],
  );

  const footer = (
    <>
      {!spotifyClientId.clientId && (
        <p className="max-w-lg text-xs text-amber-200/90 drop-shadow">
          Tap the 🔌 in the top right to connect your own free Spotify app and hear real music —
          showing sample records for now.
        </p>
      )}

      {spotifyClientId.clientId && auth.status === 'logged-out' && (
        <button
          type="button"
          onClick={auth.login}
          className="rounded-full bg-[#1ed760] px-4 py-1.5 text-xs font-semibold text-black shadow-lg transition hover:brightness-110"
        >
          Connect Spotify
        </button>
      )}

      {loggedIn && selectedPlaylist && (
        <p className="max-w-lg text-xs text-amber-100/90 drop-shadow">
          {selectedPlaylistTracks?.length ? (
            <>
              Loaded {selectedPlaylistTracks.length} track
              {selectedPlaylistTracks.length === 1 ? '' : 's'} from "{selectedPlaylist.name}".
            </>
          ) : (
            <>"{selectedPlaylist.name}" loaded 0 tracks — it may genuinely be empty, or Spotify withheld the track data.</>
          )}
        </p>
      )}

      {loggedIn && !auth.isPremium && (
        <p className="max-w-lg text-xs text-amber-200/90 drop-shadow">
          Spotify Premium wasn't detected on this account, so playback is link-out only — click a
          record to see it in Now Playing, then use "Open in Spotify" to hear it.
        </p>
      )}

      {loggedIn && !selectedPlaylist && shelf.error && (
        <p className="max-w-lg text-xs text-red-300 drop-shadow">
          Couldn't load your library: {shelf.error}
        </p>
      )}
    </>
  );

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#14150f]">
      <Scene
        shelfTracks={shelfTracks}
        shelfPool={shelfPool}
        topTracks={topTracks}
        nowPlaying={nowPlaying}
        highlightedTrackId={highlightedTrackId}
        previewOnly={!loggedIn || !auth.isPremium}
        onSelectTrack={playTrack}
        onOpenPlaylistBook={handleOpenPlaylistBook}
        footer={footer}
        onPlayPause={handlePlayPause}
        onSkipNext={handleSkipNext}
        onSkipPrevious={handleSkipPrevious}
        onVolumeUp={() => handleVolumeChange(VOLUME_STEP)}
        onVolumeDown={() => handleVolumeChange(-VOLUME_STEP)}
        shuffleEnabled={shuffleEnabled}
        onToggleShuffle={() => setShuffleEnabled((s) => !s)}
        shelfPage={clampedShelfPage}
        shelfPageCount={shelfPageCount}
        onPrevShelfPage={() => setShelfPage((p) => Math.max(0, p - 1))}
        onNextShelfPage={() => setShelfPage((p) => Math.min(shelfPageCount - 1, p + 1))}
        isMediaPanelOpen={isMediaPanelOpen}
        onOpenMediaPanel={() => setIsMediaPanelOpen(true)}
        onCloseMediaPanel={() => setIsMediaPanelOpen(false)}
        isNightMode={isNightMode}
        isSearchOpen={isSearchOpen}
        onOpenSearch={() => setIsSearchOpen(true)}
        onCloseSearch={() => setIsSearchOpen(false)}
        onSearchSelect={handleSearchSelect}
        isHelpOpen={isHelpOpen}
        onOpenHelp={() => setIsHelpOpen(true)}
        onCloseHelp={() => setIsHelpOpen(false)}
        onOpenConnection={() => setIsConnectionOpen(true)}
      />

      {isBookOpen && (
        <PlaylistBook
          playlists={playlistsData.playlists}
          loading={playlistsData.loading}
          error={playlistsData.error}
          selectedPlaylistId={selectedPlaylist?.id ?? null}
          selectingPlaylistId={selectingPlaylistId}
          selectError={selectError}
          isNightMode={isNightMode}
          onToggleNightMode={handleToggleNightMode}
          onSelect={handleSelectPlaylist}
          onClose={() => setIsBookOpen(false)}
          onLogout={() => {
            setIsBookOpen(false);
            setSelectedPlaylist(null);
            setSelectedPlaylistTracks(null);
            setShelfPage(0);
            auth.logout();
          }}
          onOpenHelp={() => {
            setIsBookOpen(false);
            setIsHelpOpen(true);
          }}
        />
      )}

      {isConnectionOpen && (
        <ConnectionPaper
          isOwnClientId={spotifyClientId.isOwnClientId}
          onConnect={(clientId) => {
            spotifyClientId.setClientId(clientId);
            setIsConnectionOpen(false);
            auth.login();
          }}
          onDisconnect={() => {
            spotifyClientId.clearClientId();
            auth.logout();
            setIsConnectionOpen(false);
          }}
          onClose={() => setIsConnectionOpen(false)}
        />
      )}

      <a
        href="https://github.com/aislop-coder/spotify-vynil-room"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-white/40 underline-offset-2 hover:text-white/70 hover:underline"
      >
        View on GitHub
      </a>
    </div>
  );
}

export default App;
