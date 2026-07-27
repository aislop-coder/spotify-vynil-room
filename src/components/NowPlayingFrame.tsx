import type { LayoutRegion } from '../types/layout';
import type { SpotifyTrack } from '../types/spotify';
import { PosterTexture } from './PosterTexture';

interface NowPlayingFrameProps {
  region: LayoutRegion;
  track: SpotifyTrack | null;
  previewOnly: boolean;
}

export function NowPlayingFrame({ region, track, previewOnly }: NowPlayingFrameProps) {
  const artUrl = track?.album.images[0]?.url;

  const content = (
    <>
      {artUrl && (
        <img
          src={artUrl}
          alt={track ? `${track.name} by ${track.artists.map((a) => a.name).join(', ')}` : 'Now playing'}
          className="h-full w-full object-cover brightness-75"
        />
      )}
      <PosterTexture />
    </>
  );

  return (
    <div
      className="absolute overflow-hidden bg-[#e9dcc3]"
      style={{
        left: `${region.xPercent}%`,
        top: `${region.yPercent}%`,
        width: `${region.widthPercent}%`,
        height: `${region.heightPercent}%`,
      }}
    >
      {track && previewOnly ? (
        <a
          href={`https://open.spotify.com/track/${track.id}`}
          target="_blank"
          rel="noreferrer"
          className="block h-full w-full"
          title={`Open "${track.name}" in Spotify`}
        >
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
