import { Fragment, useCallback, useState } from 'react';

function assignRef(ref, el) {
  if (!ref) return;
  if (typeof ref === 'function') ref(el);
  else ref.current = el;
}

/**
 * Virtual list with a single overflow-auto container (vertical + horizontal).
 * minTableWidth enables horizontal scroll only when the table is wider than the viewport.
 */
export function VirtualList({
  itemCount,
  itemHeight,
  maxHeight,
  headerHeight = 0,
  header = null,
  minTableWidth,
  overscan = 6,
  className = '',
  scrollClassName = '',
  scrollRef,
  onScroll: onScrollProp,
  children,
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const onScroll = useCallback(
    (e) => {
      setScrollTop(e.currentTarget.scrollTop);
      onScrollProp?.(e);
    },
    [onScrollProp],
  );

  const setScrollRef = useCallback(
    (el) => {
      assignRef(scrollRef, el);
    },
    [scrollRef],
  );

  const bodyScrollTop = Math.max(0, scrollTop - headerHeight);
  const start = Math.max(
    0,
    Math.floor(bodyScrollTop / itemHeight) - overscan,
  );
  const visibleCount =
    Math.ceil(Math.max(itemHeight, maxHeight - headerHeight) / itemHeight) +
    overscan * 2;
  const end = Math.min(itemCount, start + visibleCount);
  const offsetY = start * itemHeight;
  const rowsTotalHeight = itemCount * itemHeight;

  return (
    <div
      ref={setScrollRef}
      className={`w-full overflow-x-auto overflow-y-auto overscroll-contain ${scrollClassName} ${className}`}
      style={{
        maxHeight,
        WebkitOverflowScrolling: 'touch',
      }}
      onScroll={onScroll}
    >
      <div
        className="w-full min-w-full"
        style={minTableWidth != null ? { minWidth: minTableWidth } : undefined}
      >
        {header ? (
          <div className="sticky top-0 z-20 w-full" style={{ height: headerHeight }}>
            {header}
          </div>
        ) : null}

        <div className="w-full" style={{ height: rowsTotalHeight, position: 'relative' }}>
          <div className="w-full" style={{ transform: `translateY(${offsetY}px)` }}>
            {Array.from({ length: end - start }, (_, i) => {
              const index = start + i;
              return (
                <Fragment key={index}>
                  {children({ index, style: { height: itemHeight } })}
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
