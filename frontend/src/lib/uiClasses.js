/** Tailwind classes with light/dark support (html.dark). */
export const ui = {
  page: 'min-h-screen bg-slate-100 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100',
  heading: 'text-slate-900 dark:text-white',
  text: 'text-slate-600 dark:text-slate-400',
  textMuted: 'text-slate-500 dark:text-slate-500',
  textLabel: 'text-slate-700 dark:text-slate-300',
  accent: 'text-emerald-600 dark:text-emerald-400',
  accentSoft: 'text-emerald-700 dark:text-emerald-400/90',
  card:
    'rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/80',
  /** Bloque dentro de una sección (contrasta con fondo blanco de chartCard). */
  block:
    'rounded-xl border border-slate-200/90 bg-slate-100/90 dark:border-slate-600 dark:bg-slate-800/55',
  /** @deprecated Prefer ui.block */
  cardMuted:
    'rounded-xl border border-slate-200/90 bg-slate-100/90 dark:border-slate-600 dark:bg-slate-800/55',
  /** Fila o mini-panel sobre un block */
  cardInset:
    'rounded-lg border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900/70',
  cardDashed:
    'rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/40',
  panel: 'rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60',
  chartCard:
    'rounded-2xl border border-slate-200/90 bg-white p-5 shadow-md shadow-slate-900/5 ring-1 ring-slate-900/[0.03] dark:border-slate-700 dark:bg-slate-900 dark:shadow-lg dark:shadow-black/25 dark:ring-white/[0.04]',
  /** Espaciado entre secciones principales de página */
  stackPage: 'space-y-8',
  /** Dentro de una sección (chartCard) */
  stackSection: 'space-y-4',
  /** Entre bloques anidados (block) */
  stackBlocks: 'space-y-3',
  kpiCard:
    'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-slate-700',
  navTab:
    'rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
  navTabActive:
    'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm dark:border-slate-500 dark:bg-slate-800 dark:text-white',
  profileChip:
    'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80',
  profileAvatar:
    'bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300',
  bannerGuest:
    'flex flex-col gap-3 rounded-2xl border border-emerald-400/35 bg-emerald-100/90 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-500/25 dark:bg-emerald-950/50',
  bannerGuestText: 'text-emerald-950 dark:text-emerald-100',
  bannerGuestBtn:
    'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 bg-emerald-700',
  bannerGuestLater:
    'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-emerald-800/90 transition hover:bg-emerald-200/60 hover:text-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:text-emerald-300/90 dark:hover:bg-emerald-900/60 dark:hover:text-emerald-100',
  input:
    'w-full min-h-[2.75rem] rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-600',
  inputMoney: 'pl-9',
  /** 0–100 % — fixed width (Tu parte, tasas, etc.) */
  inputPercent:
    'h-11 min-h-0 w-[5.5rem] max-w-[36vw] shrink-0 rounded-xl border border-slate-300 bg-white px-2 py-2 text-right text-sm tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white',
  /** € amounts, patrimonio, cuotas — not full panel width on desktop */
  inputAmount: 'max-w-[12rem]',
  /** Age, pagas, small integers */
  inputNarrow: 'max-w-[6.5rem]',
  /** Short labels / names in forms */
  inputMedium: 'max-w-md',
  inputError:
    'w-full min-h-[2.75rem] rounded-xl border border-red-400 bg-white px-4 py-3 text-base text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 dark:border-red-500/70 dark:bg-slate-900 dark:text-white',
  btnSecondary:
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800',
  /** Text-only control (enlace de acción) */
  btnLink:
    'inline-flex cursor-pointer items-center text-sm font-medium underline-offset-2 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded-md px-1 -mx-1 text-emerald-700 dark:text-emerald-400',
  /** Inline action (Editar, enlaces en tablas) */
  actionLink:
    'cursor-pointer text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400',
  actionLinkDanger:
    'cursor-pointer text-sm font-medium text-red-600 hover:underline dark:text-red-400',
  /** Cambiar vista simple / detallada de gastos */
  btnViewToggle:
    'inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800',
  expenseSummary:
    'overflow-hidden rounded-xl border border-slate-200/90 bg-white divide-y divide-slate-200 dark:border-slate-600 dark:bg-slate-900/50 dark:divide-slate-700/80',
  scenarioChip:
    'rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-700 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:text-emerald-300',
  scenarioChipActive:
    'rounded-full border border-emerald-500 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-300',
  inputCompact: '!min-h-0 py-2 text-sm',
  /** Touch-friendly checkbox (min row height via label wrapper). */
  checkbox:
    'h-5 w-5 shrink-0 rounded border-slate-400 text-emerald-500 focus:ring-emerald-500/40 dark:border-slate-600 dark:bg-slate-900',
  choiceChip:
    'inline-flex h-11 min-h-[2.75rem] cursor-pointer items-center rounded-xl border px-3.5 text-sm transition',
  choiceChipActive:
    'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100',
  choiceChipIdle:
    'border-slate-200/90 bg-slate-100/90 text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800/55 dark:text-slate-300',
  /** Two-line slots so grid columns keep inputs aligned when hints wrap. */
  formFieldLabel:
    'mb-1.5 block min-h-10 text-sm font-medium leading-snug line-clamp-2',
  formFieldHint:
    'mb-2 h-10 shrink-0 overflow-hidden text-xs leading-snug line-clamp-2',
  formFieldControl: 'min-h-[2.75rem] shrink-0',
  btnPrimary:
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-40',
  navLink:
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
  navLinkActive:
    'rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  progressTrack: 'h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800',
  divider: 'border-slate-200 dark:border-slate-800',
  select:
    'rounded-lg border border-slate-300 bg-white py-1.5 pl-3 pr-11 text-sm text-slate-800 appearance-none focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200',
  selectField:
    'w-full min-h-[2.75rem] cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-4 pr-12 text-base text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white',
  /** Pair with SelectField overlay chevron (hides native arrow, reserves right space). */
  selectWithChevron:
    'cursor-pointer appearance-none !pr-12',
  selectChevron: 'text-slate-400 dark:text-slate-500',
  iconBtn:
    'cursor-pointer rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800',
  iconBtnActive:
    'rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-400',
  menuTrigger:
    'rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
  menuTriggerActive:
    'rounded-xl border border-emerald-500 bg-white text-emerald-700 shadow-md ring-2 ring-emerald-500/30 dark:bg-slate-800 dark:text-emerald-300',
  menuBackdrop: 'absolute inset-0 bg-slate-900/55 dark:bg-black/70',
  menuPanel:
    'absolute right-4 top-4 z-[201] flex w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/10 dark:border-slate-600 dark:bg-slate-900 dark:shadow-black/50 dark:ring-white/10',
  menuInnerBorder: 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80',
  modalBackdrop:
    'absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] dark:bg-black/70',
  modalPanel:
    'relative z-[211] w-full max-w-[26rem] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900 dark:shadow-2xl dark:ring-white/5',
  modalBody: 'px-6 py-5',
  modalFooter:
    'flex flex-col gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80',
  authIconWrap:
    'mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/25',
  authEmailChip:
    'mt-4 break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-sm font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100',
  btnGhost:
    'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
  authTab:
    'flex-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition dark:text-slate-400',
  authTabActive:
    'flex-1 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-white dark:ring-slate-600',
  authTabTrack:
    'mb-6 grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100/90 p-1 dark:border-slate-700 dark:bg-slate-800/90',
};
