import { useMemo, useState } from 'react';
import type { SpotifyTrack } from '../types/spotify';

interface TypewriterSearchProps {
  tracks: SpotifyTrack[];
  onSelect: (track: SpotifyTrack) => void;
  onClose: () => void;
}

export function TypewriterSearch({ tracks, onSelect, onClose }: TypewriterSearchProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return tracks
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) || t.artists.some((a) => a.name.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [tracks, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[8vh]" onClick={onClose}>
      <div
        className="relative w-[26rem] max-w-[90vw] rounded-sm bg-[#faf6ec] p-6 shadow-2xl"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 28px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="absolute right-3 top-3 text-lg leading-none text-[#8a7a5f] hover:text-[#2a2118]"
        >
          &times;
        </button>
        <h2
          className="mb-3 text-lg text-[#2a2118]"
          style={{ fontFamily: "'Courier New', monospace", fontWeight: 700 }}
        >
          Find a record…
        </h2>
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a song or artist"
          className="w-full border-0 border-b-2 border-[#2a2118]/30 bg-transparent pb-1 text-base text-[#2a2118] outline-none placeholder:text-[#8a7a5f]"
          style={{ fontFamily: "'Courier New', monospace" }}
        />

        <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
          {query.trim() && results.length === 0 && (
            <p className="py-2 text-sm text-[#8a7a5f]" style={{ fontFamily: "'Courier New', monospace" }}>
              No matches on this shelf.
            </p>
          )}
          {results.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => onSelect(track)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-black/5"
            >
              {track.album.images[0]?.url ? (
                <img src={track.album.images[0].url} alt="" className="h-8 w-8 shrink-0 rounded-sm object-cover" />
              ) : (
                <div className="h-8 w-8 shrink-0 rounded-sm bg-[#8a6b4f]" />
              )}
              <span className="min-w-0 flex-1">
                <span
                  className="block truncate text-sm text-[#2a2118]"
                  style={{ fontFamily: "'Courier New', monospace" }}
                >
                  {track.name}
                </span>
                <span
                  className="block truncate text-xs text-[#6b5d4f]"
                  style={{ fontFamily: "'Courier New', monospace" }}
                >
                  {track.artists.map((a) => a.name).join(', ')}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
