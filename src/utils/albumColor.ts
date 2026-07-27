// Extracts a muted sleeve color from a track's album art, toned down (desaturated,
// darkened) so it stays easy on the eyes rather than reproducing the art's raw,
// often-bright colors directly.

const MAX_SATURATION = 38;
const MIN_LIGHTNESS = 20;
const MAX_LIGHTNESS = 42;

const colorCache = new Map<string, Promise<string | null>>();

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  return { h: h * 60, s: s * 100, l: l * 100 };
}

function toneDown(h: number, s: number, l: number): string {
  const tonedS = Math.min(MAX_SATURATION, s * 0.65);
  const tonedL = Math.max(MIN_LIGHTNESS, Math.min(MAX_LIGHTNESS, l * 0.75));
  return `hsl(${Math.round(h)}, ${Math.round(tonedS)}%, ${Math.round(tonedL)}%)`;
}

function extractAverageColor(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 12;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        r /= count;
        g /= count;
        b /= count;
        const { h, s, l } = rgbToHsl(r, g, b);
        resolve(toneDown(h, s, l));
      } catch {
        // Canvas reads throw if the image loaded without CORS clearance ("tainted" canvas).
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Muted sleeve color extracted from album art, cached per image URL. Resolves to null on failure (no art, CORS, etc). */
export function getAlbumSleeveColor(imageUrl: string | null | undefined): Promise<string | null> {
  if (!imageUrl) return Promise.resolve(null);
  let cached = colorCache.get(imageUrl);
  if (!cached) {
    cached = extractAverageColor(imageUrl);
    colorCache.set(imageUrl, cached);
  }
  return cached;
}
