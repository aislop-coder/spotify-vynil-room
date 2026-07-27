import type { LayoutRegion } from '../types/layout';

interface PageFrameProps {
  region: LayoutRegion;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

/**
 * The small frame above the typewriter, normally just decorative. When a playlist
 * has more tracks than fit on the shelf at once, it becomes a page indicator with
 * click zones on its left/right halves to flip between shelves of records.
 */
export function PageFrame({ region, currentPage, totalPages, onPrevPage, onNextPage }: PageFrameProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      className="absolute flex overflow-hidden bg-[#e9dcc3] text-[9px] font-semibold text-[#6b5d4f]"
      style={{
        left: `${region.xPercent}%`,
        top: `${region.yPercent}%`,
        width: `${region.widthPercent}%`,
        height: `${region.heightPercent}%`,
      }}
    >
      <button
        type="button"
        onClick={onPrevPage}
        disabled={currentPage === 0}
        aria-label="Previous shelf page"
        className="flex h-full flex-1 items-center justify-center border-0 bg-transparent outline-none transition hover:bg-black/5 disabled:opacity-20"
      >
        ‹
      </button>
      <div className="flex flex-col items-center justify-center border-x border-black/10 px-0.5 text-center leading-tight">
        <span>{currentPage + 1}</span>
        <span className="opacity-60">/{totalPages}</span>
      </div>
      <button
        type="button"
        onClick={onNextPage}
        disabled={currentPage === totalPages - 1}
        aria-label="Next shelf page"
        className="flex h-full flex-1 items-center justify-center border-0 bg-transparent outline-none transition hover:bg-black/5 disabled:opacity-20"
      >
        ›
      </button>
    </div>
  );
}
