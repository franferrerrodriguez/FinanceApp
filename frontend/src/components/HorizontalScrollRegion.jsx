import { forwardRef, useCallback, useEffect, useRef } from 'react';
import { useHorizontalScrollEdges } from '../hooks/useHorizontalScrollEdges';

function ScrollHintIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-[var(--accent)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0-4-4m4 4-4 4M16 17H4m0 0 4 4m-4-4 4-4" />
    </svg>
  );
}

function assignRef(ref, el) {
  if (typeof ref === 'function') ref(el);
  else if (ref) ref.current = el;
}

/** Horizontal scroll hint (place above the full table, not only the scrollable part). */
export function ScrollHintBanner({ hint, show }) {
  if (!hint || !show) return null;

  return (
    <p className="mb-0 flex items-center gap-2 rounded-lg [border:0.5px_solid_rgba(255,255,255,0.10)] bg-[var(--bg-tertiary)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] md:hidden">
      <ScrollHintIcon />
      <span>{hint}</span>
    </p>
  );
}

/**
 * Container with horizontal scroll and right fade on mobile.
 * Place ScrollHintBanner outside when there are sticky columns beside it.
 */
export const HorizontalScrollRegion = forwardRef(function HorizontalScrollRegion(
  { children, className = '', onScrollEdgesChange },
  forwardedRef,
) {
  const scrollRef = useRef(null);
  const { overflow, right, updateEdges } = useHorizontalScrollEdges(scrollRef, [
    children,
  ]);

  const setScrollRef = useCallback(
    (el) => {
      scrollRef.current = el;
      assignRef(forwardedRef, el);
    },
    [forwardedRef],
  );

  useEffect(() => {
    onScrollEdgesChange?.({ overflow, right });
  }, [overflow, right, onScrollEdgesChange]);

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-[inherit]">
        {right ? (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[var(--bg-secondary)] via-[var(--bg-secondary)]/90 to-transparent md:hidden"
            aria-hidden
          />
        ) : null}

        <div
          ref={setScrollRef}
          onScroll={updateEdges}
          className="overflow-x-auto overflow-y-clip overscroll-x-contain scroll-smooth rounded-[inherit] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:h-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(255,255,255,0.18)]"
          tabIndex={0}
        >
          {children}
        </div>
      </div>
    </div>
  );
});
