import type { SpotifyTrack } from '../types/spotify';

const MUTED_SWATCHES = [
  '#8a6b4f',
  '#6b7a52',
  '#9c5f43',
  '#4f6b63',
  '#a1793d',
  '#6f5b6b',
  '#7a5240',
  '#5c6b4a',
  '#8f6a5a',
  '#4a5a5c',
];

function swatchDataUri(color: string, seed: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="${color}"/><circle cx="100" cy="100" r="${40 + (seed % 20)}" fill="rgba(0,0,0,0.15)"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const ADJECTIVES = [
  'Harvest',
  'Wisteria',
  'Amber',
  'Slow Burn',
  'Copper',
  'Faded',
  'Late',
  'Analog',
  'Paper',
  'Low Tide',
  'Terracotta',
  'Velvet',
  'Quiet',
  'Rooftop',
  'Sepia',
  'Honeyed',
  'Dusty',
  'Marigold',
  'Evening',
  'Driftwood',
];

const NOUNS = [
  'Moon',
  'Lane',
  'Radio',
  'Sunday',
  'Rust',
  'Recordings',
  'Bloomer',
  'Heart',
  'Windows',
  'Blues',
  'Skies',
  'Static',
  'Machine',
  'Weather',
  'Tone',
  'Light',
  'Denim',
  'Wax',
  'Hour',
  'Room',
];

const ARTISTS = [
  'The Ochre Room',
  'Marigold Static',
  'Coastal Drift',
  'The Amber Hour',
  'Pale Radio',
  'Wren & Copper',
  'Slowlight',
  'The Loam',
  'Rust & Wren',
  'Low Tide Sons',
  'The Paper Moths',
  'Faded Denim Co.',
];

function buildMockTracks(): SpotifyTrack[] {
  const tracks: SpotifyTrack[] = [];
  let i = 0;
  for (const adj of ADJECTIVES) {
    for (const noun of NOUNS) {
      const title = `${adj} ${noun}`;
      tracks.push({
        id: `mock-${i}`,
        uri: `spotify:track:mock-${i}`,
        name: title,
        artists: [{ id: `mock-artist-${i % ARTISTS.length}`, name: ARTISTS[i % ARTISTS.length] }],
        album: {
          id: `mock-album-${i}`,
          name: title,
          images: [
            { url: swatchDataUri(MUTED_SWATCHES[i % MUTED_SWATCHES.length], i), width: 200, height: 200 },
          ],
        },
        duration_ms: 150_000 + ((i * 3729) % 120_000),
      });
      i++;
    }
  }
  return tracks;
}

export const MOCK_TRACKS: SpotifyTrack[] = buildMockTracks();

export const MOCK_TOP_TRACKS = MOCK_TRACKS.slice(0, 4);
