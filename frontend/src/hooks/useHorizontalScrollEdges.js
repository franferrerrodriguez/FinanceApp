import { useCallback, useEffect, useState } from 'react';

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
