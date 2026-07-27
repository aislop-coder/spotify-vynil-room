import mediaControlsImage from '../assets/media controls.png';
import type { MediaPanelLayout } from '../types/layout';
import type { SpotifyTrack } from '../types/spotify';
import { MarqueeText } from './MarqueeText';

interface MediaControlPanelProps {
  layout: MediaPanelLayout;
  nowPlaying: SpotifyTrack | null;
  shuffleEnabled: boolean;
  onToggleShuffle: () => void;
  onClose: () => void;
  onPlayPause: () => void;
  onSkipNext: () => void;
  onSkipPrevious: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
}

function regionStyle(region: MediaPanelLayout['buttons']['previous']) {
  return {
    left: `${region.xPercent}%`,
    top: `${region.yPercent}%`,
    width: `${region.widthPercent}%`,
    height: `${region.heightPercent}%`,
  };
}

export function MediaControlPanel({
  layout,
  nowPlaying,
  shuffleEnabled,
  onToggleShuffle,
  onClose,
  onPlayPause,
  onSkipNext,
  onSkipPrevious,
  onVolumeUp,
  onVolumeDown,
}: MediaControlPanelProps) {
  const { buttons, songTitle, minimize } = layout;

  return (
    <>
      <img
        src={mediaControlsImage}
        alt="Enlarged media control panel"
        draggable={false}
        className="absolute inset-0 h-full w-full select-none"
        style={{ filter: 'drop-shadow(0 14px 22px rgba(0,0,0,0.55))' }}
      />

      <div
        className="absolute flex flex-col items-start justify-center gap-0 overflow-hidden px-[3%]"
        style={{ ...regionStyle(songTitle), transform: 'translate(5px, 18%)' }}
      >
        {nowPlaying && (
          <>
            <MarqueeText
              text={nowPlaying.name}
              className="w-full text-left leading-none text-[#ff9d3d]"
              style={{
                fontFamily: "'VT323', monospace",
                fontSize: '1.5vw',
                letterSpacing: '0.06em',
                textShadow: '0 0 8px rgba(255,157,61,0.8), 0 0 3px rgba(255,157,61,0.9)',
              }}
            />
            <MarqueeText
              text={nowPlaying.artists.map((a) => a.name).join(', ')}
              className="w-full text-left leading-none text-[#ff9d3d] opacity-80"
              style={{
                fontFamily: "'VT323', monospace",
                fontSize: '1vw',
                letterSpacing: '0.08em',
                textShadow: '0 0 6px rgba(255,157,61,0.7)',
              }}
            />
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onSkipPrevious}
        aria-label="Previous track"
        title="Previous track"
        className="absolute cursor-pointer border-0 bg-transparent p-0 outline-none transition hover:bg-white/20"
        style={regionStyle(buttons.previous)}
      />
      <button
        type="button"
        onClick={onPlayPause}
        aria-label="Play or pause"
        title="Play or pause"
        className="absolute cursor-pointer border-0 bg-transparent p-0 outline-none transition hover:bg-white/20"
        style={regionStyle(buttons.playPause)}
      />
      <button
        type="button"
        onClick={onSkipNext}
        aria-label="Next track"
        title="Next track"
        className="absolute cursor-pointer border-0 bg-transparent p-0 outline-none transition hover:bg-white/20"
        style={regionStyle(buttons.next)}
      />
      <button
        type="button"
        onClick={onToggleShuffle}
        aria-label="Toggle shuffle"
        title="Toggle shuffle"
        className="absolute flex cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 outline-none transition hover:bg-white/20"
        style={regionStyle(buttons.shuffle)}
      >
        <span
          className="rounded-full"
          style={{
            width: '30%',
            height: '30%',
            backgroundColor: shuffleEnabled ? '#1ed760' : '#ffffff',
            boxShadow: shuffleEnabled ? '0 0 4px rgba(30,215,96,0.9)' : '0 0 2px rgba(0,0,0,0.5)',
          }}
        />
      </button>
      <button
        type="button"
        onClick={onVolumeDown}
        aria-label="Volume down"
        title="Volume down"
        className="absolute cursor-pointer border-0 bg-transparent p-0 outline-none transition hover:bg-white/20"
        style={regionStyle(buttons.volumeDown)}
      />
      <button
        type="button"
        onClick={onVolumeUp}
        aria-label="Volume up"
        title="Volume up"
        className="absolute cursor-pointer border-0 bg-transparent p-0 outline-none transition hover:bg-white/20"
        style={regionStyle(buttons.volumeUp)}
      />

      <button
        type="button"
        onClick={onClose}
        aria-label="Minimize media panel"
        title="Minimize"
        className="absolute flex cursor-pointer items-center justify-center rounded-full border border-black/30 bg-[#f4ead9] leading-none text-[#2a2118] shadow transition hover:brightness-95"
        style={regionStyle(minimize)}
      >
        <span style={{ fontSize: '1vw' }}>&minus;</span>
      </button>
    </>
  );
}
