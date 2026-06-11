import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';

function ScrollHintIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
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

export function useHorizontalScrollEdges(scrollRef, deps = []) {
  const [scroll, setScroll] = useState({ overflow: false, right: false });

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const overflow = el.scrollWidth > el.clientWidth + 2;
    const right =
      overflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setScroll((prev) =>
      prev.overflow === overflow && prev.right === right ? prev : { overflow, right },
    );
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateEdges();
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    const inner = el.firstElementChild;
    if (inner) ro.observe(inner);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remeasure when table content changes
  }, [updateEdges, ...deps]);

  return { ...scroll, updateEdges };
}

/** Horizontal scroll hint (place above the full table, not only the scrollable part). */
export function ScrollHintBanner({ hint, show }) {
  if (!hint || !show) return null;

  return (
    <p className="mb-0 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 md:hidden">
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
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white via-white/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 md:hidden"
            aria-hidden
          />
        ) : null}

        <div
          ref={setScrollRef}
          onScroll={updateEdges}
          className="overflow-x-auto overflow-y-clip overscroll-x-contain scroll-smooth rounded-[inherit] [-webkit-overflow-scrolling:touch]"
          tabIndex={0}
        >
          {children}
        </div>
      </div>
    </div>
  );
});
