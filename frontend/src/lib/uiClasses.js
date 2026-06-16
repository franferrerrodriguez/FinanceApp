/**
 * Design System tokens — dark-only palette.
 * All values map directly to DESIGN_SYSTEM.md.
 * Never write raw hex values in JSX; use these tokens.
 */
export const ui = {
  // ── Page & Layout ───────────────────────────────────────────────
  page: 'min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased',

  // ── Typography ──────────────────────────────────────────────────
  heading: 'tracking-[-0.02em] text-[var(--text-primary)]',
  pageTitle:
    'text-2xl font-semibold tracking-[-0.024em] leading-tight text-[var(--text-primary)]',
  displayTitle:
    'text-[2.125rem] font-semibold leading-[1.08] tracking-[-0.028em] text-[var(--text-primary)] sm:text-[2.375rem]',
  displaySubtitle:
    'text-[1.0625rem] font-normal leading-[1.47] tracking-[-0.011em] text-[var(--text-muted)]',
  text: 'text-[1.0625rem] leading-[1.47] tracking-[-0.011em] text-[var(--text-secondary)]',
  textMuted: 'text-[var(--text-muted)]',
  textLabel: 'text-[var(--text-secondary)]',
  accent: 'text-[var(--accent)]',
  accentSoft: 'text-[var(--accent)]',

  // ── Cards ───────────────────────────────────────────────────────
  card: 'rounded-2xl [border:var(--border-default-rule)] bg-[var(--bg-secondary)]',
  /** Inner block that contrasts with card background */
  block: 'rounded-xl [border:var(--border-subtle-rule)] bg-[var(--bg-tertiary)]',
  /** @deprecated use ui.block */
  cardMuted: 'rounded-xl [border:var(--border-subtle-rule)] bg-[var(--bg-tertiary)]',
  cardInset: 'rounded-xl [border:0.5px_solid_rgba(255,255,255,0.08)] bg-[var(--bg-tertiary)]',
  cardDashed:
    'rounded-2xl [border:0.5px_dashed_rgba(255,255,255,0.12)] bg-[var(--bg-secondary)]/40',
  panel: 'rounded-2xl [border:var(--border-default-rule)] bg-[var(--bg-secondary)] p-5',
  chartCard: 'rounded-2xl [border:var(--border-default-rule)] bg-[var(--bg-secondary)] p-5',
  kpiCard:
    'rounded-2xl [border:var(--border-default-rule)] bg-[var(--bg-secondary)] p-4 transition',

  // ── Spacing ─────────────────────────────────────────────────────
  /** Between top-level page sections */
  stackPage: 'space-y-8',
  /** Inside a section card */
  stackSection: 'space-y-4',
  /** Between nested blocks */
  stackBlocks: 'space-y-4',

  // ── Navigation ──────────────────────────────────────────────────
  navTab:
    'rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:text-[var(--text-primary)]',
  navTabActive:
    'rounded-lg [border:var(--border-strong-rule)] bg-[var(--bg-tertiary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]',
  navLink:
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]',
  navLinkActive:
    'rounded-lg bg-[rgba(29,158,117,0.15)] px-3 py-2 text-sm font-medium text-[var(--accent)]',

  // ── Dividers ────────────────────────────────────────────────────
  divider: 'border-[rgba(255,255,255,0.08)]',

  // ── Inputs ──────────────────────────────────────────────────────
  input:
    'w-full h-12 rounded-xl [border:var(--border-default-rule)] bg-[var(--bg-tertiary)] px-4 py-0 text-[1.0625rem] tracking-[-0.011em] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[rgba(29,158,117,0.5)]',
  inputMoney: 'pr-9',
  inputSuffixAdornment:
    'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]',
  /** Fixed-width percentage input (share, rates) */
  inputPercent:
    'h-12 w-[5.5rem] max-w-[36vw] shrink-0 rounded-xl [border:var(--border-default-rule)] bg-[var(--bg-tertiary)] px-4 py-0 text-[1.0625rem] tabular-nums tracking-[-0.011em] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[rgba(29,158,117,0.5)]',
  /** € amounts — not full width on desktop */
  inputAmount: 'max-w-[12rem]',
  /** Age, pagas, small integers */
  inputNarrow: 'max-w-[6.5rem]',
  /** Short labels / names */
  inputMedium: 'max-w-md',
  inputError:
    'w-full h-12 rounded-xl [border:var(--border-error-rule)] bg-[var(--bg-tertiary)] px-4 py-0 text-[1.0625rem] tracking-[-0.011em] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[rgba(226,75,74,0.5)]',
  inputCompact: '!h-auto !py-2 text-sm',

  // ── Buttons ─────────────────────────────────────────────────────
  btnPrimary:
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(29,158,117,0.5)] disabled:cursor-not-allowed disabled:opacity-40',
  btnSecondary:
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-[14px] [border:var(--border-default-rule)] bg-transparent px-5 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:[border-color:rgba(255,255,255,0.18)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
  /** Text-only action link */
  btnLink:
    'inline-flex cursor-pointer items-center text-sm font-medium underline-offset-2 transition hover:underline focus-visible:outline-none rounded-md px-1 -mx-1 text-[var(--accent)]',
  btnGhost:
    'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] focus-visible:outline-none',
  /** View toggle (simple/detailed) */
  btnViewToggle:
    'inline-flex items-center rounded-[10px] [border:var(--border-default-rule)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:[border-color:rgba(255,255,255,0.18)] hover:bg-[var(--bg-hover)] focus-visible:outline-none',
  /** Inline table action */
  actionLink: 'cursor-pointer text-sm font-medium text-[var(--accent)] hover:underline',
  actionLinkDanger:
    'cursor-pointer text-sm font-medium text-[var(--color-negative)] hover:underline',

  // ── Form fields ─────────────────────────────────────────────────
  formFieldLabel:
    'block text-sm font-medium leading-snug tracking-[-0.01em] text-[var(--text-secondary)]',
  formFieldHint: 'block text-xs leading-snug text-[var(--text-muted)]',
  formFieldHintGap: 'mt-0.5',
  formFieldHintAfter: 'mb-2',
  /** Grid slot: reserves space so inputs align when hints differ */
  formFieldLabelGridSlot: 'min-h-[2.75rem] line-clamp-2',
  formFieldHintGridSlot: 'min-h-[2.5rem] line-clamp-2 overflow-hidden',
  formFieldControl: 'min-h-[2.75rem] shrink-0',

  // ── Select ──────────────────────────────────────────────────────
  select:
    'rounded-lg [border:var(--border-default-rule)] bg-[var(--bg-tertiary)] py-1.5 pl-3 pr-11 text-sm text-[var(--text-secondary)] appearance-none focus:outline-none focus:ring-1 focus:ring-[rgba(29,158,117,0.5)]',
  selectField:
    'w-full min-h-[2.75rem] cursor-pointer appearance-none rounded-xl [border:var(--border-default-rule)] bg-[var(--bg-tertiary)] py-2.5 pl-4 pr-12 text-[1.0625rem] tracking-[-0.011em] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[rgba(29,158,117,0.5)]',
  /** Pair with SelectField overlay chevron */
  selectWithChevron: 'cursor-pointer appearance-none !pr-12',
  selectChevron: 'text-[var(--text-muted)]',

  // ── Checkbox ────────────────────────────────────────────────────
  checkbox:
    'h-5 w-5 shrink-0 rounded [border:0.5px_solid_rgba(255,255,255,0.20)] bg-[var(--bg-tertiary)] text-[var(--accent)] focus:ring-[rgba(29,158,117,0.40)]',

  // ── Choice chips ────────────────────────────────────────────────
  choiceChip:
    'inline-flex h-11 min-h-[2.75rem] cursor-pointer items-center rounded-xl [border:0.5px_solid_transparent] px-3.5 text-sm transition',
  choiceChipActive: '[border-color:rgba(29,158,117,0.5)] bg-[var(--accent-muted)] text-[var(--accent)]',
  choiceChipIdle:
    '[border-color:rgba(255,255,255,0.10)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:[border-color:rgba(255,255,255,0.18)]',

  // ── Scenario chips ──────────────────────────────────────────────
  scenarioChip:
    'rounded-full [border:var(--border-default-rule)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition hover:[border-color:rgba(29,158,117,0.40)] hover:bg-[var(--accent-muted)] hover:text-[var(--accent)]',
  scenarioChipActive:
    'rounded-full [border:0.5px_solid_rgba(29,158,117,0.5)] bg-[var(--accent-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)]',

  // ── Icon buttons ────────────────────────────────────────────────
  iconBtn:
    'cursor-pointer rounded-lg [border:var(--border-default-rule)] p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]',
  iconBtnActive:
    'rounded-lg [border:0.5px_solid_rgba(29,158,117,0.5)] bg-[var(--accent-muted)] p-2 text-[var(--accent)]',

  // ── Menu ────────────────────────────────────────────────────────
  menuTrigger:
    'rounded-xl [border:var(--border-default-rule)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)]',
  menuTriggerActive:
    'rounded-xl [border:0.5px_solid_rgba(29,158,117,0.4)] bg-[var(--bg-secondary)] text-[var(--accent)] ring-2 ring-[rgba(29,158,117,0.20)]',
  menuBackdrop: 'absolute inset-0 bg-black/60 backdrop-blur-[2px]',
  menuPanel:
    'absolute right-4 top-[calc(1rem+env(safe-area-inset-top,0px))] z-[201] flex w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl [border:0.5px_solid_rgba(255,255,255,0.12)] bg-[var(--bg-secondary)] shadow-2xl',
  menuInnerBorder: '[border:0.5px_solid_rgba(255,255,255,0.08)] bg-[var(--bg-tertiary)]',

  // ── Modals ──────────────────────────────────────────────────────
  modalBackdrop: 'absolute inset-0 bg-black/60 backdrop-blur-[2px]',
  modalPanel:
    'relative z-[211] w-full max-w-[26rem] overflow-hidden rounded-[20px] [border:0.5px_solid_rgba(255,255,255,0.12)] bg-[var(--bg-secondary)] shadow-xl',
  modalBody: 'px-6 py-5',
  modalFooter:
    'flex flex-col gap-2 [border-top:0.5px_solid_rgba(255,255,255,0.06)] bg-[var(--bg-secondary)] px-6 py-4',

  // ── Auth ────────────────────────────────────────────────────────
  authIconWrap:
    'mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-muted)] text-[var(--accent)] ring-1 ring-[rgba(29,158,117,0.25)]',
  authEmailChip:
    'mt-4 break-all rounded-lg [border:var(--border-default-rule)] bg-[var(--bg-tertiary)] px-3 py-2.5 text-center text-sm font-medium text-[var(--text-primary)]',
  authTab:
    'flex-1 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition',
  authTabActive:
    'flex-1 rounded-lg bg-[var(--bg-tertiary)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] shadow-sm ring-1 ring-[rgba(255,255,255,0.10)]',
  authTabTrack:
    'mb-6 grid grid-cols-2 gap-1 rounded-xl [border:var(--border-default-rule)] bg-[var(--bg-tertiary)] p-1',

  // ── Save-progress banner ─────────────────────────────────────────
  bannerGuest:
    'flex flex-col gap-3 rounded-2xl [border:var(--border-accent-rule)] bg-[rgba(29,158,117,0.08)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between',
  bannerGuestText: 'text-[var(--accent)]',
  bannerGuestBtn:
    'inline-flex items-center justify-center rounded-[14px] px-4 py-2.5 text-sm font-semibold text-white bg-[var(--accent)] transition hover:bg-[var(--accent)]/80 focus-visible:outline-none',
  bannerGuestLater:
    'inline-flex items-center justify-center rounded-[14px] px-4 py-2.5 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent-muted)] focus-visible:outline-none',

  // ── Profile ─────────────────────────────────────────────────────
  profileChip: '[border:var(--border-default-rule)] bg-[var(--bg-tertiary)]',
  profileAvatar: 'bg-[rgba(29,158,117,0.20)] text-[var(--accent)]',

  // ── Other ───────────────────────────────────────────────────────
  progressTrack: 'h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]',
  expenseSummary:
    'overflow-hidden rounded-xl [border:var(--border-default-rule)] bg-[var(--bg-secondary)] divide-y divide-[rgba(255,255,255,0.06)]',
};
