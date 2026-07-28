import grungeTexture from '../assets/grunge-texture.jpg';

/** Grunge halftone texture, laid over album art via blend modes to read as a worn printed poster. */
export function PosterTexture() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `url(${grungeTexture})`,
        backgroundSize: '180px 180px',
        mixBlendMode: 'soft-light',
        opacity: 0.7,
      }}
    />
  );
}
