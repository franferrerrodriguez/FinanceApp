import { BRAND_NAME, BRAND_URL } from '../lib/brand';

const CURRENT_YEAR = new Date().getFullYear();

/* eslint-disable no-undef */
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null;

export { APP_VERSION };

export function AppFooter() {
  const brand = BRAND_URL ? (
    <a
      href={BRAND_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
    >
      {BRAND_NAME}
    </a>
  ) : (
    <span className="font-semibold text-[var(--text-secondary)]">{BRAND_NAME}</span>
  );

  return (
    <footer className="mt-12 border-t py-8 pb-12 text-center [border-color:rgba(255,255,255,0.06)]">
      <p className="text-sm tracking-[-0.01em] text-[var(--text-muted)]">
        By {brand}
      </p>
      {APP_VERSION ? (
        <p className="mt-1 text-[11px] text-[var(--text-muted)] opacity-50">
          v{APP_VERSION} · © {CURRENT_YEAR}
        </p>
      ) : (
        <p className="mt-1 text-[11px] text-[var(--text-muted)] opacity-50">
          © {CURRENT_YEAR}
        </p>
      )}
    </footer>
  );
}
