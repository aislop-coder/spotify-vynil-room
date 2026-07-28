import shelfLayout from '../data/shelfLayout.json';
import type { ShelfLayout } from '../types/layout';
import type { SpotifyTrack } from '../types/spotify';

const layout = shelfLayout as ShelfLayout;

const MIN_RECORDS = 6;
const MAX_RECORDS = 25;
// Target width as a percent of the full shelf image — thin spines, several times
// narrower than the original 1.3% pass. Kept as a single global constant so every
// record is the same visual thickness, regardless of which cubby it's in or how
// many tracks actually landed there.
const TARGET_RECORD_WIDTH_PERCENT = 0.48;

// Trimmed off the right-hand end of every cubby's slot count, purely to leave a
// little breathing room at the end of each row instead of packing it edge to edge.
const RIGHT_TRIM = 2;

/** How many record slots a cubby of this width would like to show, before considering track availability. */
export function getDesiredRecordCount(cubbyWidthPercent: number): number {
  const raw = Math.max(MIN_RECORDS, Math.round(cubbyWidthPercent / TARGET_RECORD_WIDTH_PERCENT));
  return Math.min(MAX_RECORDS, Math.max(3, raw - RIGHT_TRIM));
}

/**
 * A record's width expressed as a percent of ITS OWN cubby's box (what CSS needs
 * for a flex child), scaled so the rendered width is the same fixed fraction of
 * the whole shelf image no matter which cubby it's in. Fixed, not derived from
 * how many records actually ended up in the cubby — a half-empty cubby just
 * leaves blank space instead of stretching its records to fill the gap.
 */
export function getRecordWidthPercentOfCubby(cubbyWidthPercent: number): number {
  return (TARGET_RECORD_WIDTH_PERCENT / cubbyWidthPercent) * 100;
}

/** Total record slots across the whole shelf — how many tracks one page can show at once. */
export function getShelfCapacity(): number {
  return layout.cubbies.reduce((total, cubby) => total + getDesiredRecordCount(cubby.widthPercent), 0);
}

/** Deduped (by id) and sorted alphabetically by title — the canonical order tracks appear on the shelf in. */
export function prepareTrackPool(tracks: SpotifyTrack[]): SpotifyTrack[] {
  const seen = new Set<string>();
  const deduped: SpotifyTrack[] = [];
  for (const track of tracks) {
    if (seen.has(track.id)) continue;
    seen.add(track.id);
    deduped.push(track);
  }
  return deduped.sort((a, b) => a.name.localeCompare(b.name));
}

export function getShelfPageCount(poolSize: number): number {
  const capacity = getShelfCapacity();
  return Math.max(1, Math.ceil(poolSize / capacity));
}

/** The slice of an already-prepared track pool that belongs on the given page (0-indexed). */
export function getShelfPageTracks(pool: SpotifyTrack[], page: number): SpotifyTrack[] {
  const capacity = getShelfCapacity();
  const start = page * capacity;
  return pool.slice(start, start + capacity);
}
