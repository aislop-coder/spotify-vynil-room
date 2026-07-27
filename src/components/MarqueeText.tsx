import { useEffect, useRef } from 'react';

interface MarqueeTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

const STATIC_MS = 3000;
const PIXELS_PER_SECOND = 35;

/** Scrolling ticker for text that overflows its box — holds still for 3s, then scrolls once through and loops. */
export function MarqueeText({ text, className, style }: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const el = textRef.current;
    if (!container || !el) return;

    el.getAnimations().forEach((a) => a.cancel());
    const overflow = el.scrollWidth - container.clientWidth;

    if (overflow > 4) {
      const scrollMs = (overflow / PIXELS_PER_SECOND) * 1000;
      const total = STATIC_MS + scrollMs;
      const stopOffset = STATIC_MS / total;
      el.animate(
        [
          { transform: 'translateX(0)', offset: 0 },
          { transform: 'translateX(0)', offset: stopOffset },
          { transform: `translateX(-${overflow}px)`, offset: 1 },
        ],
        { duration: total, iterations: Infinity },
      );
    } else {
      el.style.transform = 'translateX(0)';
    }
  }, [text]);

  return (
    <div ref={containerRef} className={`overflow-hidden ${className ?? ''}`} style={style}>
      <span ref={textRef} className="inline-block whitespace-nowrap">
        {text}
      </span>
    </div>
  );
}
