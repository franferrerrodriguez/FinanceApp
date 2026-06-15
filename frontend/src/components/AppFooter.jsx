import { BRAND_NAME, BRAND_URL } from '../lib/brand';

const CURRENT_YEAR = new Date().getFullYear();

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
    <footer className="mt-12 py-8 pb-12 text-center">
      <p className="text-sm tracking-[-0.01em] text-[var(--text-muted)]">
        By {brand}
      </p>
      <p className="mt-1 text-[10px] text-[var(--text-muted)] opacity-60">
        © {CURRENT_YEAR}
      </p>
    </footer>
  );
}
