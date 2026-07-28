import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { SpotifyTrack } from '../types/spotify';
import { getFallbackSleeveColor, getJaggedClipPath, getSpineShadingOverlay } from './recordStyle';
import { getAlbumSleeveColor } from '../utils/albumColor';

interface RecordProps {
  track: SpotifyTrack;
  instanceKey: string;
  widthPercent: number;
  isActive: boolean;
  onSelect: (track: SpotifyTrack) => void;
}

export function Record({ track, instanceKey, widthPercent, isActive, onSelect }: RecordProps) {
  const [hovered, setHovered] = useState(false);
  const clipPath = getJaggedClipPath(instanceKey);
  const shading = getSpineShadingOverlay(instanceKey);
  const artUrl = track.album.images[0]?.url;
  const [sleeveColor, setSleeveColor] = useState(() => getFallbackSleeveColor(instanceKey));

  useEffect(() => {
    let cancelled = false;
    getAlbumSleeveColor(artUrl).then((color) => {
      if (!cancelled && color) setSleeveColor(color);
    });
    return () => {
      cancelled = true;
    };
  }, [artUrl]);

  return (
    <div
      className="relative shrink-0 self-end"
      style={{ width: `${widthPercent}%`, height: '80%', perspective: '500px', zIndex: hovered ? 30 : undefined }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.92 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-full left-1/2 z-20 mb-2 w-28 -translate-x-1/2 rounded-md border border-black/30 bg-[#f4ead9] p-1.5 text-center shadow-xl"
          >
            {artUrl && (
              <img src={artUrl} alt="" className="mb-1 aspect-square w-full rounded-sm object-cover" />
            )}
            <p className="truncate text-[10px] font-medium leading-tight text-[#2a2118]">{track.name}</p>
            <p className="truncate text-[9px] leading-tight text-[#6b5d4f]">
              {track.artists.map((a) => a.name).join(', ')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => onSelect(track)}
        aria-label={`Play ${track.name} by ${track.artists.map((a) => a.name).join(', ')}`}
        className="h-full w-full cursor-pointer border-0 p-0 outline-none"
        style={{ transformStyle: 'preserve-3d', transformOrigin: 'bottom center' }}
        animate={
          hovered
            ? { rotateX: -28, z: 22, y: -6 }
            : { rotateX: 0, z: 0, y: 0 }
        }
        transition={{ type: 'spring', stiffness: 300, damping: 22, duration: 0.3 }}
      >
        <div
          className="h-full w-full"
          style={{
            backgroundColor: sleeveColor,
            backgroundImage: shading,
            clipPath,
            boxShadow: isActive
              ? 'inset 0 0 0 1.5px rgba(230, 170, 90, 0.9), 1px 0 2px rgba(0,0,0,0.5)'
              : '1px 0 2px rgba(0,0,0,0.5), -1px 0 2px rgba(0,0,0,0.2)',
          }}
        />
      </motion.button>
    </div>
  );
}
