import { useEffect, useState } from 'react';
import { ui } from '../lib/uiClasses';

const NARROW_MEDIA = '(max-width: 639px)';

/**
 * Horizontal tab bar (underline active). Scrolls on narrow screens; works in web and Capacitor WebView.
 */
export function UnderlineTabNav({
  tabs,
  activeId,
  onChange,
  ariaLabel,
  className = '',
}) {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(NARROW_MEDIA).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(NARROW_MEDIA);
    const onChangeMq = () => setNarrow(mq.matches);
    mq.addEventListener('change', onChangeMq);
    setNarrow(mq.matches);
    return () => mq.removeEventListener('change', onChangeMq);
  }, []);

  return (
    <nav
      className={`-mx-1 border-b ${ui.divider} ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <div
        className="flex gap-0 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
      >
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          const label =
            narrow && tab.labelShort != null ? tab.labelShort : tab.label;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={active}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => onChange(tab.id)}
              className={`shrink-0 cursor-pointer whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(29,158,117,0.40)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] ${
                active
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : `border-transparent ${ui.textMuted} hover:text-[var(--text-secondary)]`
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
