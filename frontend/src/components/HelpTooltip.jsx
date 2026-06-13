import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const TRIGGER_SIZE = {
  sm: 'h-4 w-4 text-[10px]',
  md: 'h-6 w-6 text-sm ring-1 ring-inset ring-[rgba(255,255,255,0.12)]',
};

export function HelpTooltip({ ariaLabel, children, symbol = '?', size = 'sm' }) {
  const tooltipId = useId();
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updateCoords = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.min(window.innerWidth - 32, 288);
    let left = rect.left;
    if (left + width > window.innerWidth - 16) {
      left = window.innerWidth - 16 - width;
    }
    left = Math.max(16, left);
    setCoords({ top: rect.bottom + 6, left });
  }, []);

  const show = useCallback(() => {
    updateCoords();
    setOpen(true);
  }, [updateCoords]);

  const hide = useCallback(() => setOpen(false), []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const onReposition = () => updateCoords();
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    return () => {
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
  }, [open, updateCoords]);

  return (
    <>
      <span
        ref={triggerRef}
        className="relative inline-flex shrink-0 align-middle"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <span
          tabIndex={0}
          role="img"
          aria-label={ariaLabel}
          aria-describedby={open ? tooltipId : undefined}
          className={`inline-flex cursor-help items-center justify-center rounded-full font-semibold leading-none transition hover:bg-[var(--accent-muted)] hover:text-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[rgba(29,158,117,0.40)] text-[var(--text-muted)] ${TRIGGER_SIZE[size] ?? TRIGGER_SIZE.sm}`}
        >
          {symbol}
        </span>
      </span>

      {open
        ? createPortal(
            <div
              id={tooltipId}
              role="tooltip"
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                zIndex: 9999,
                width: 'min(100vw - 2rem, 18rem)',
              }}
              className="pointer-events-none"
            >
              <div
                className="rounded-xl [border:0.5px_solid_rgba(255,255,255,0.14)] bg-[var(--bg-tertiary)] p-3 text-left text-xs leading-relaxed text-[var(--text-secondary)] shadow-2xl"
              >
                {children}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
