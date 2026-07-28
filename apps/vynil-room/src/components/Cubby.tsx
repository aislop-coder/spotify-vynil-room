import { motion } from 'framer-motion';
import type { LayoutRegion } from '../types/layout';
import type { SpotifyTrack } from '../types/spotify';
import { Record } from './Record';
import { getRecordWidthPercentOfCubby } from './shelfAllocation';

interface CubbyProps {
  region: LayoutRegion;
  tracks: SpotifyTrack[];
  activeTrackId: string | null;
  highlightedTrackId?: string | null;
  onSelectTrack: (track: SpotifyTrack) => void;
}

// Fractions of the cubby's OWN box, applied here as pre-computed inline coordinates.
// (CSS percentage padding on an absolutely-positioned element resolves against its
// containing block's width, not its own — so it can't be used for this inset.)
const SIDE_INSET_FRACTION = 0.04;
const BOTTOM_INSET_FRACTION = 0.03;

export function Cubby({ region, tracks, activeTrackId, highlightedTrackId, onSelectTrack }: CubbyProps) {
  if (tracks.length === 0) return null;

  const sideInset = region.widthPercent * SIDE_INSET_FRACTION;
  const bottomInset = region.heightPercent * BOTTOM_INSET_FRACTION;
  const recordWidthPercent = getRecordWidthPercentOfCubby(region.widthPercent);
  // Search highlights the whole cubby, not the exact record — you still have to spot it on the shelf.
  const isHighlighted = highlightedTrackId != null && tracks.some((t) => t.id === highlightedTrackId);

  return (
    <>
      {isHighlighted && (
        <motion.div
          className="pointer-events-none absolute z-30 rounded-sm"
          style={{
            left: `${region.xPercent}%`,
            top: `${region.yPercent}%`,
            width: `${region.widthPercent}%`,
            height: `${region.heightPercent}%`,
          }}
          animate={{
            boxShadow: [
              '0 0 0 2px rgba(255,215,120,0.9)',
              '0 0 10px 4px rgba(255,215,120,0.5)',
              '0 0 0 2px rgba(255,215,120,0.9)',
            ],
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
      <div
        className="absolute flex items-end justify-start gap-[0.5%]"
        style={{
          left: `${region.xPercent + sideInset}%`,
          top: `${region.yPercent}%`,
          width: `${region.widthPercent - sideInset * 2}%`,
          height: `${region.heightPercent - bottomInset}%`,
        }}
      >
        {tracks.map((track, i) => (
          <Record
            key={`${region.id}-${track.id}-${i}`}
            track={track}
            instanceKey={`${region.id}-${i}-${track.id}`}
            widthPercent={recordWidthPercent}
            isActive={track.id === activeTrackId}
            onSelect={onSelectTrack}
          />
        ))}
      </div>
    </>
  );
}
