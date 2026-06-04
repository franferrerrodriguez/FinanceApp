import { Fragment, useCallback, useState } from 'react';

function assignRef(ref, el) {
  if (!ref) return;
  if (typeof ref === 'function') ref(el);
  else ref.current = el;
}

/**
 * Lista virtual con un único contenedor overflow-auto (vertical + horizontal).
 * Evita scroll anidado que obliga a “hacer scroll dos veces”.
 */
export function VirtualList({
  itemCount,
  itemHeight,
  maxHeight,
  headerHeight = 0,
  header = null,
  minWidth,
  overscan = 6,
  className = '',
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
      className={`overflow-auto overscroll-contain ${className}`}
      style={{
        maxHeight,
        WebkitOverflowScrolling: 'touch',
      }}
      onScroll={onScroll}
    >
      <div
        style={{
          minWidth: minWidth ?? undefined,
          width: minWidth ? 'max-content' : '100%',
        }}
      >
        {header ? (
          <div
            className="sticky top-0 z-20"
            style={{ height: headerHeight }}
          >
            {header}
          </div>
        ) : null}

        <div style={{ height: rowsTotalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
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
