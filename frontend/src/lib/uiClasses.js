/** Clases Tailwind con soporte claro/oscuro (html.dark). */
export const ui = {
  page: 'min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100',
  heading: 'text-slate-900 dark:text-white',
  text: 'text-slate-600 dark:text-slate-400',
  textMuted: 'text-slate-500 dark:text-slate-500',
  textLabel: 'text-slate-700 dark:text-slate-300',
  accent: 'text-emerald-600 dark:text-emerald-400',
  accentSoft: 'text-emerald-700 dark:text-emerald-400/90',
  card:
    'rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60',
  cardMuted:
    'rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40',
  cardInset:
    'rounded-xl border border-slate-200 bg-slate-100/80 dark:border-slate-700 dark:bg-slate-800/50',
  cardDashed:
    'rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/40',
  panel: 'rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60',
  chartCard:
    'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/70 dark:shadow-none',
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
    'rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400',
  bannerGuestLater:
    'rounded-lg px-3 py-2 text-sm font-medium text-emerald-800/90 transition hover:bg-emerald-200/60 hover:text-emerald-950 dark:text-emerald-300/90 dark:hover:bg-emerald-900/60 dark:hover:text-emerald-100',
  input:
    'w-full min-h-[2.75rem] rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-600',
  inputMoney: 'pl-9',
  inputError:
    'w-full min-h-[2.75rem] rounded-xl border border-red-400 bg-white px-4 py-3 text-base text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 dark:border-red-500/70 dark:bg-slate-900 dark:text-white',
  btnSecondary:
    'rounded-xl border border-slate-300 py-3 font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800',
  scenarioChip:
    'rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-700 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:text-emerald-300',
  scenarioChipActive:
    'rounded-full border border-emerald-500 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-300',
  inputCompact: '!min-h-0 py-2 text-sm',
  btnPrimary:
    'rounded-xl bg-emerald-500 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40',
  navLink:
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
  navLinkActive:
    'rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  progressTrack: 'h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800',
  divider: 'border-slate-200 dark:border-slate-800',
  select:
    'rounded-lg border border-slate-300 bg-white py-1.5 pl-3 pr-9 text-sm text-slate-800 appearance-none focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200',
  selectField:
    'w-full min-h-[2.75rem] cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-4 pr-11 text-base text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white',
  selectChevron: 'text-slate-400 dark:text-slate-500',
  iconBtn:
    'rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800',
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
};
