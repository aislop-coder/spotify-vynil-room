const FALLBACK_HUES = [
  { h: 28, s: 32, l: 34 }, // burnt sienna
  { h: 84, s: 22, l: 30 }, // olive
  { h: 200, s: 18, l: 28 }, // muted teal
  { h: 45, s: 38, l: 40 }, // mustard
  { h: 350, s: 24, l: 32 }, // brick
  { h: 265, s: 14, l: 30 }, // faded mauve
  { h: 20, s: 28, l: 24 }, // dark umber
  { h: 60, s: 20, l: 36 }, // dusty gold
];

const JAGGED_TOP_PATHS = [
  'polygon(0% 8%, 12% 1%, 24% 6%, 38% 0%, 52% 5%, 66% 2%, 80% 7%, 100% 3%, 100% 100%, 0% 100%)',
  'polygon(0% 4%, 14% 7%, 28% 1%, 44% 6%, 58% 0%, 72% 5%, 86% 1%, 100% 6%, 100% 100%, 0% 100%)',
  'polygon(0% 6%, 10% 2%, 22% 8%, 36% 3%, 50% 0%, 64% 6%, 78% 2%, 92% 7%, 100% 2%, 100% 100%, 0% 100%)',
  'polygon(0% 2%, 16% 6%, 30% 0%, 46% 4%, 60% 8%, 74% 1%, 88% 5%, 100% 0%, 100% 100%, 0% 100%)',
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Deterministic-but-varied jagged top edge per record instance so repeated tracks don't render identically. */
export function getJaggedClipPath(instanceKey: string): string {
  const hash = hashString(instanceKey);
  return JAGGED_TOP_PATHS[(hash >> 4) % JAGGED_TOP_PATHS.length];
}

/** Muted color used before album-art extraction resolves, or if it fails (e.g. no art, CORS blocked). */
export function getFallbackSleeveColor(instanceKey: string): string {
  const hash = hashString(instanceKey);
  const base = FALLBACK_HUES[hash % FALLBACK_HUES.length];
  const lightnessJitter = ((hash >> 8) % 9) - 4; // +/-4%
  return `hsl(${base.h}, ${base.s}%, ${Math.max(18, base.l + lightnessJitter)}%)`;
}

/**
 * A subtle light/shadow gradient laid over the sleeve color, like a real spine
 * catching light unevenly — a highlight streak plus darker shadow edges, so
 * flat-filled records read as having some roundness/depth instead of paper-flat.
 */
export function getSpineShadingOverlay(instanceKey: string): string {
  const hash = hashString(instanceKey);
  const highlightPos = 30 + (hash % 25); // 30-54%
  const highlightStrength = 0.1 + ((hash >> 6) % 6) / 100; // 0.10-0.15
  return [
    `linear-gradient(90deg,`,
    `rgba(0,0,0,0.35) 0%,`,
    `rgba(0,0,0,0.08) 12%,`,
    `rgba(255,255,255,${highlightStrength}) ${highlightPos}%,`,
    `rgba(0,0,0,0.05) ${highlightPos + 20}%,`,
    `rgba(0,0,0,0.4) 100%)`,
  ].join(' ');
}
