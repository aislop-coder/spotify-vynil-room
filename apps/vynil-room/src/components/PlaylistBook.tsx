import { AnimatePresence, motion, Reorder } from 'framer-motion';
import { useState } from 'react';
import type { SpotifyPlaylistSummary } from '../spotify/api';
import { usePlaylistOrder } from '../hooks/usePlaylistOrder';

interface PlaylistBookProps {
  playlists: SpotifyPlaylistSummary[];
  loading: boolean;
  error: string | null;
  selectedPlaylistId: string | null;
  selectingPlaylistId: string | null;
  selectError: string | null;
  isNightMode: boolean;
  onToggleNightMode: () => void;
  onSelect: (playlist: SpotifyPlaylistSummary) => void;
  onClose: () => void;
  onLogout: () => void;
  onOpenHelp: () => void;
}

// The right-hand page turns around the spine (its own left edge), like a real page.
const pageVariants = {
  enter: (direction: number) => ({ rotateY: direction > 0 ? 130 : -130, opacity: 0.3 }),
  center: { rotateY: 0, opacity: 1 },
  exit: (direction: number) => ({ rotateY: direction > 0 ? -130 : 130, opacity: 0.3 }),
};

export function PlaylistBook({
  playlists,
  loading,
  error,
  selectedPlaylistId,
  selectingPlaylistId,
  selectError,
  isNightMode,
  onToggleNightMode,
  onSelect,
  onClose,
  onLogout,
  onOpenHelp,
}: PlaylistBookProps) {
  const [[pageIndex, direction], setPage] = useState<[number, number]>([0, 0]);
  const [isReordering, setIsReordering] = useState(false);
  const { orderedPlaylists, setOrder } = usePlaylistOrder(playlists);

  const goTo = (next: number) => {
    if (next < 0 || next >= orderedPlaylists.length) return;
    setPage([next, next > pageIndex ? 1 : -1]);
  };

  const playlist = orderedPlaylists[pageIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="relative flex h-[24rem] w-[38rem] max-w-full rounded-md bg-[#3a2b1e] p-3 shadow-2xl"
        style={{ perspective: '1600px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#f4ead9] text-base leading-none text-[#2a2118] shadow"
        >
          &times;
        </button>

        {/* Left page — static, or a drag-to-reorder list when in reorder mode */}
        <div className="relative flex w-1/2 flex-col rounded-l-sm bg-[#f4ead9] px-6 py-6 shadow-[inset_-10px_0_16px_-12px_rgba(0,0,0,0.4)]">
          {!isReordering ? (
            <>
              <button
                type="button"
                onClick={() => setIsReordering(true)}
                aria-label="Reorder playlists"
                title="Reorder playlists"
                className="absolute right-4 top-4 text-[19px] text-[#8a7a5f] hover:text-[#2a2118]"
              >
                ⚙
              </button>
              <button
                type="button"
                onClick={onOpenHelp}
                aria-label="Help"
                title="Help"
                className="absolute right-11 top-4 text-[19px] text-[#8a7a5f] hover:text-[#2a2118]"
              >
                ❓
              </button>
              <button
                type="button"
                onClick={onToggleNightMode}
                aria-label={isNightMode ? 'Switch to day mode' : 'Switch to night mode'}
                title={isNightMode ? 'Switch to day mode' : 'Switch to night mode'}
                className="absolute left-4 top-4 text-[19px] text-[#8a7a5f] hover:text-[#2a2118]"
              >
                {isNightMode ? '☀' : '☾'}
              </button>
              <div className="flex flex-1 flex-col items-center justify-center gap-2">
                <h2 className="text-center text-lg font-bold uppercase tracking-[0.25em] text-[#2a2118]">
                  Playlists
                </h2>
                <p className="text-center text-xs leading-relaxed text-[#6b5d4f]">
                  Turn the page to browse your playlists, then select one to fill the shelf.
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="mx-auto text-[10px] font-semibold uppercase tracking-widest text-[#a8823f] underline underline-offset-2 hover:text-[#2a2118]"
              >
                Log out of Spotify
              </button>
            </>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#2a2118]">Reorder</h2>
                <button
                  type="button"
                  onClick={() => setIsReordering(false)}
                  className="rounded-full bg-[#1ed760] px-3 py-1 text-[10px] font-semibold text-black shadow hover:brightness-110"
                >
                  Done
                </button>
              </div>
              <p className="mb-2 text-[10px] leading-snug text-[#6b5d4f]">Drag to set the order they appear in.</p>
              <Reorder.Group
                axis="y"
                values={orderedPlaylists}
                onReorder={setOrder}
                className="flex-1 space-y-1 overflow-y-auto pr-1"
              >
                {orderedPlaylists.map((p) => (
                  <Reorder.Item
                    key={p.id}
                    value={p}
                    className="flex cursor-grab items-center gap-2 rounded bg-white/50 px-2 py-1.5 shadow-sm active:cursor-grabbing"
                  >
                    <span className="text-[#8a7a5f]">⠿</span>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="h-6 w-6 shrink-0 rounded-sm object-cover" />
                    ) : (
                      <div className="h-6 w-6 shrink-0 rounded-sm bg-[#8a6b4f]" />
                    )}
                    <span className="truncate text-[11px] text-[#2a2118]">{p.name}</span>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </>
          )}
        </div>

        {/* Spine */}
        <div className="w-2 shrink-0 bg-gradient-to-r from-black/50 via-black/10 to-black/50" />

        {/* Right page — flips */}
        <div className="relative w-1/2 overflow-hidden rounded-r-sm bg-[#f4ead9] shadow-[inset_10px_0_16px_-12px_rgba(0,0,0,0.4)]" style={{ transformStyle: 'preserve-3d' }}>
          {loading && (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[#6b5d4f]">
              Loading playlists…
            </div>
          )}

          {!loading && error && (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-red-800/80">
              Couldn't load playlists: {error}
            </div>
          )}

          {!loading && !error && orderedPlaylists.length === 0 && (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[#6b5d4f]">
              No playlists found on this account.
            </div>
          )}

          {!loading && !error && playlist && (
            <AnimatePresence mode="popLayout" custom={direction} initial={false}>
              <motion.div
                key={playlist.id}
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: 'easeInOut' }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-6 py-6"
                style={{ transformStyle: 'preserve-3d', transformOrigin: 'left center', backfaceVisibility: 'hidden' }}
              >
                {playlist.imageUrl ? (
                  <img
                    src={playlist.imageUrl}
                    alt=""
                    className="aspect-square w-36 rounded-sm object-cover shadow-md"
                  />
                ) : (
                  <div className="aspect-square w-36 rounded-sm bg-[#8a6b4f]" />
                )}
                <p className="line-clamp-2 text-center text-base font-bold leading-tight text-[#2a2118]">
                  {playlist.name}
                </p>
                <p className="text-xs uppercase tracking-wide text-[#6b5d4f]">
                  {playlist.trackCount} {playlist.trackCount === 1 ? 'song' : 'songs'}
                </p>
                <button
                  type="button"
                  onClick={() => onSelect(playlist)}
                  className="mt-1 rounded-full bg-[#1ed760] px-5 py-2 text-xs font-semibold text-black shadow transition hover:brightness-110 disabled:cursor-default disabled:opacity-60"
                  disabled={selectedPlaylistId === playlist.id || selectingPlaylistId === playlist.id}
                >
                  {selectingPlaylistId === playlist.id
                    ? 'Loading…'
                    : selectedPlaylistId === playlist.id
                      ? 'Selected'
                      : 'Select Playlist'}
                </button>
                {selectError && selectingPlaylistId === null && (
                  <p className="max-w-[14rem] text-[10px] text-red-700/80">{selectError}</p>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {orderedPlaylists.length > 1 && (
            <div className="absolute inset-x-0 bottom-2 flex items-center justify-between px-4">
              <button
                type="button"
                onClick={() => goTo(pageIndex - 1)}
                disabled={pageIndex === 0}
                className="text-[17px] text-[#6b5d4f] hover:text-[#2a2118] disabled:opacity-20"
                aria-label="Previous playlist"
              >
                ‹
              </button>
              <span className="text-[10px] uppercase tracking-wide text-[#8a7a5f]">
                {pageIndex + 1} / {orderedPlaylists.length}
              </span>
              <button
                type="button"
                onClick={() => goTo(pageIndex + 1)}
                disabled={pageIndex === orderedPlaylists.length - 1}
                className="text-[17px] text-[#6b5d4f] hover:text-[#2a2118] disabled:opacity-20"
                aria-label="Next playlist"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
