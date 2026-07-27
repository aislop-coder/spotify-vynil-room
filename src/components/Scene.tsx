import { useMemo, type ReactNode } from 'react';
import roomIllustration from '../assets/room-illustration.png';
import roomIllustrationNight from '../assets/office_scene_night.png';
import helpScreenImage from '../assets/help_screen.png';
import shelfLayout from '../data/shelfLayout.json';
import type { ShelfLayout } from '../types/layout';
import type { SpotifyTrack } from '../types/spotify';
import { Cubby } from './Cubby';
import { Frame } from './Frame';
import { NowPlayingFrame } from './NowPlayingFrame';
import { PageFrame } from './PageFrame';
import { MediaControlPanel } from './MediaControlPanel';
import { TypewriterSearch } from './TypewriterSearch';
import { getDesiredRecordCount, prepareTrackPool } from './shelfAllocation';

const layout = shelfLayout as ShelfLayout;

/** Hands each cubby a non-overlapping slice of the (deduped) pool, in order, so no record repeats on the shelf. */
function allocateShelfTracks(pool: SpotifyTrack[]): SpotifyTrack[][] {
  let cursor = 0;
  return layout.cubbies.map((cubby) => {
    const desired = getDesiredRecordCount(cubby.widthPercent);
    const slice = pool.slice(cursor, cursor + desired);
    cursor += slice.length;
    return slice;
  });
}

interface SceneProps {
  shelfTracks: SpotifyTrack[];
  shelfPool: SpotifyTrack[];
  topTracks: SpotifyTrack[];
  nowPlaying: SpotifyTrack | null;
  highlightedTrackId: string | null;
  previewOnly: boolean;
  onSelectTrack: (track: SpotifyTrack) => void;
  onOpenPlaylistBook: () => void;
  onPlayPause: () => void;
  onSkipNext: () => void;
  onSkipPrevious: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  shuffleEnabled: boolean;
  onToggleShuffle: () => void;
  shelfPage: number;
  shelfPageCount: number;
  onPrevShelfPage: () => void;
  onNextShelfPage: () => void;
  isMediaPanelOpen: boolean;
  onOpenMediaPanel: () => void;
  onCloseMediaPanel: () => void;
  isNightMode: boolean;
  isSearchOpen: boolean;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onSearchSelect: (track: SpotifyTrack) => void;
  isHelpOpen: boolean;
  onCloseHelp: () => void;
  onOpenConnection: () => void;
  /** Rendered as an overlay bar anchored to the bottom edge of the scene (e.g. connect/status controls). */
  footer?: ReactNode;
}

const KNOB_HANDLERS: Record<string, keyof SceneProps> = {
  'knob-prev': 'onSkipPrevious',
  'knob-play-pause': 'onPlayPause',
  'knob-next': 'onSkipNext',
  'knob-volume-down': 'onVolumeDown',
  'knob-volume-up': 'onVolumeUp',
};

const KNOB_LABELS: Record<string, string> = {
  'knob-prev': 'Previous track',
  'knob-play-pause': 'Play or pause',
  'knob-next': 'Next track',
  'knob-volume-down': 'Volume down',
  'knob-volume-up': 'Volume up',
};

const PAGE_NAV_FRAME_ID = 'frame-desk-page-nav';

export function Scene({
  shelfTracks,
  shelfPool,
  topTracks,
  nowPlaying,
  highlightedTrackId,
  previewOnly,
  onSelectTrack,
  onOpenPlaylistBook,
  onPlayPause,
  onSkipNext,
  onSkipPrevious,
  onVolumeUp,
  onVolumeDown,
  shuffleEnabled,
  onToggleShuffle,
  shelfPage,
  shelfPageCount,
  onPrevShelfPage,
  onNextShelfPage,
  isMediaPanelOpen,
  onOpenMediaPanel,
  onCloseMediaPanel,
  isNightMode,
  isSearchOpen,
  onOpenSearch,
  onCloseSearch,
  onSearchSelect,
  isHelpOpen,
  onCloseHelp,
  onOpenConnection,
  footer,
}: SceneProps) {
  const knobActions: Record<string, () => void> = {
    onPlayPause,
    onSkipNext,
    onSkipPrevious,
    onVolumeUp,
    onVolumeDown,
  };
  const centerFrame = layout.frames.find((f) => f.id === 'frame-center-now-playing')!;
  const pageNavFrame = layout.frames.find((f) => f.id === PAGE_NAV_FRAME_ID)!;
  const rankedFrames = layout.frames.filter(
    (f) => f.id !== 'frame-center-now-playing' && f.id !== PAGE_NAV_FRAME_ID,
  );
  const shuffleKnob = layout.knobs.find((k) => k.id === 'knob-shuffle')!;
  const otherKnobs = layout.knobs.filter((k) => k.id !== 'knob-shuffle');

  const perCubbyTracks = useMemo(() => allocateShelfTracks(prepareTrackPool(shelfTracks)), [shelfTracks]);

  return (
    <div
      className="relative select-none"
      style={{
        aspectRatio: `${layout.imageWidth} / ${layout.imageHeight}`,
        width: `min(100vw, calc(100vh * ${layout.imageWidth} / ${layout.imageHeight}))`,
        height: `min(100vh, calc(100vw * ${layout.imageHeight} / ${layout.imageWidth}))`,
      }}
    >
      <img
        src={isNightMode ? roomIllustrationNight : roomIllustration}
        alt="Illustrated 70s study with a record shelf, turntable, and receiver"
        className="absolute inset-0 h-full w-full object-fill"
        draggable={false}
      />

      {layout.cubbies.map((cubby, i) => (
        <Cubby
          key={cubby.id}
          region={cubby}
          tracks={perCubbyTracks[i]}
          activeTrackId={nowPlaying?.id ?? null}
          highlightedTrackId={highlightedTrackId}
          onSelectTrack={onSelectTrack}
        />
      ))}

      {rankedFrames.map((frame, i) => (
        <Frame key={frame.id} region={frame} track={topTracks[i] ?? null} onSelect={onSelectTrack} />
      ))}

      <NowPlayingFrame region={centerFrame} track={nowPlaying} previewOnly={previewOnly} />

      <PageFrame
        region={pageNavFrame}
        currentPage={shelfPage}
        totalPages={shelfPageCount}
        onPrevPage={onPrevShelfPage}
        onNextPage={onNextShelfPage}
      />

      {layout.books.map((book) => (
        <button
          key={book.id}
          type="button"
          onClick={onOpenPlaylistBook}
          aria-label="Choose a playlist"
          title="Choose a playlist"
          className="absolute cursor-pointer border-0 bg-transparent p-0 outline-none transition hover:bg-white/20"
          style={{
            left: `${book.xPercent}%`,
            top: `${book.yPercent}%`,
            width: `${book.widthPercent}%`,
            height: `${book.heightPercent}%`,
            clipPath: book.clipPath,
          }}
        />
      ))}

      {otherKnobs.map((knob) => {
        const handlerKey = KNOB_HANDLERS[knob.id];
        const action = handlerKey ? knobActions[handlerKey] : undefined;
        return (
          <button
            key={knob.id}
            type="button"
            onClick={action}
            aria-label={KNOB_LABELS[knob.id] ?? knob.id}
            title={KNOB_LABELS[knob.id] ?? knob.id}
            className="absolute cursor-pointer rounded-full border-0 bg-transparent p-0 outline-none transition hover:bg-white/25"
            style={{
              left: `${knob.xPercent}%`,
              top: `${knob.yPercent}%`,
              width: `${knob.widthPercent}%`,
              height: `${knob.heightPercent}%`,
            }}
          />
        );
      })}

      <button
        type="button"
        onClick={onToggleShuffle}
        aria-label="Toggle shuffle"
        title="Toggle shuffle"
        className="absolute cursor-pointer rounded-full border-0 bg-transparent p-0 outline-none transition hover:bg-white/25"
        style={{
          left: `${shuffleKnob.xPercent}%`,
          top: `${shuffleKnob.yPercent}%`,
          width: `${shuffleKnob.widthPercent}%`,
          height: `${shuffleKnob.heightPercent}%`,
        }}
      />

      <button
        type="button"
        onClick={onOpenSearch}
        aria-label="Search records"
        title="Search records"
        className="absolute cursor-pointer border-0 bg-transparent p-0 outline-none transition hover:bg-white/10"
        style={{
          left: `${layout.typewriter.xPercent}%`,
          top: `${layout.typewriter.yPercent}%`,
          width: `${layout.typewriter.widthPercent}%`,
          height: `${layout.typewriter.heightPercent}%`,
        }}
      />

      {!isMediaPanelOpen && (
        <button
          type="button"
          onClick={onOpenMediaPanel}
          aria-label="Open media control panel"
          title="Open media control panel"
          className="absolute cursor-pointer border-0 bg-transparent p-0 outline-none transition hover:bg-white/20"
          style={{
            left: `${layout.mediaPanel.trigger.xPercent}%`,
            top: `${layout.mediaPanel.trigger.yPercent}%`,
            width: `${layout.mediaPanel.trigger.widthPercent}%`,
            height: `${layout.mediaPanel.trigger.heightPercent}%`,
          }}
        />
      )}

      {isMediaPanelOpen && (
        <MediaControlPanel
          layout={layout.mediaPanel}
          nowPlaying={nowPlaying}
          shuffleEnabled={shuffleEnabled}
          onToggleShuffle={onToggleShuffle}
          onClose={onCloseMediaPanel}
          onPlayPause={onPlayPause}
          onSkipNext={onSkipNext}
          onSkipPrevious={onSkipPrevious}
          onVolumeUp={onVolumeUp}
          onVolumeDown={onVolumeDown}
        />
      )}

      {footer && (
        <div className="absolute inset-x-0 bottom-[2%] flex flex-col items-center gap-2 px-[6%] text-center">
          {footer}
        </div>
      )}

      {isSearchOpen && (
        <TypewriterSearch tracks={shelfPool} onSelect={onSearchSelect} onClose={onCloseSearch} />
      )}

      <button
        type="button"
        onClick={onOpenConnection}
        aria-label="Connection"
        title="Connection"
        className="absolute right-[2%] top-[2%] flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-[#d2b48c] drop-shadow-md transition hover:brightness-125"
      >
        🔌
      </button>

      {isHelpOpen && (
        <>
          <img
            src={helpScreenImage}
            alt="Help"
            className="absolute inset-0 h-full w-full object-fill"
            draggable={false}
          />
          <button
            type="button"
            onClick={onCloseHelp}
            aria-label="Close help"
            className="absolute right-[2%] top-[2%] flex h-8 w-8 items-center justify-center rounded-full bg-[#f4ead9] text-base leading-none text-[#2a2118] shadow"
          >
            &times;
          </button>
        </>
      )}
    </div>
  );
}
