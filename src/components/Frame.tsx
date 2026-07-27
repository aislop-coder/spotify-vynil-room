import { useState } from 'react';
import type { LayoutRegion } from '../types/layout';
import type { SpotifyTrack } from '../types/spotify';
import { PosterTexture } from './PosterTexture';

interface FrameProps {
  region: LayoutRegion;
  track: SpotifyTrack | null;
  onSelect?: (track: SpotifyTrack) => void;
}

export function Frame({ region, track, onSelect }: FrameProps) {
  const [hovered, setHovered] = useState(false);
  const artUrl = track?.album.images[0]?.url;

  return (
    <div
      className="absolute"
      style={{
        left: `${region.xPercent}%`,
        top: `${region.yPercent}%`,
        width: `${region.widthPercent}%`,
        height: `${region.heightPercent}%`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative h-full w-full overflow-hidden bg-[#e9dcc3]">
        {track && artUrl ? (
          <button
            type="button"
            onClick={() => onSelect?.(track)}
            aria-label={`Play ${track.name} by ${track.artists.map((a) => a.name).join(', ')}`}
            className="relative block h-full w-full cursor-pointer border-0 p-0"
          >
            <img
              src={artUrl}
              alt={`${track.name} by ${track.artists.map((a) => a.name).join(', ')}`}
              className={`h-full w-full object-cover transition ${hovered ? 'brightness-[0.3]' : 'brightness-75'}`}
            />
            {hovered && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-1.5 text-center">
                <p className="line-clamp-2 text-[10px] font-semibold leading-tight text-white drop-shadow-md">
                  {track.name}
                </p>
                <p className="line-clamp-1 text-[9px] leading-tight text-white/85 drop-shadow-md">
                  {track.artists.map((a) => a.name).join(', ')}
                </p>
              </div>
            )}
          </button>
        ) : null}
        <PosterTexture />
      </div>
    </div>
  );
}
