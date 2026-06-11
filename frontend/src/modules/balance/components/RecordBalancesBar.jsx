import { useTranslation } from 'react-i18next';
import { getCurrentMonthKey } from '../../../lib/dashboardMetrics';
import { ui } from '../../../lib/uiClasses';
import { formatMonthKeyLong } from '../../../utils/monthLabel';

function PendingBalancesNotice({ detail, locale, onOpen, t }) {
  if (!detail) return null;

  const { variant, month, missingItems } = detail;

  if (variant === 'overdue') {
    return (
      <p className="text-xs leading-snug text-amber-800 dark:text-amber-200 lg:text-right">
        {t('balance.recordBalancesPendingOverdue', {
          count: detail.overdueCount,
          month: detail.month,
        })}
      </p>
    );
  }

  if (!missingItems?.length) {
    return (
      <p className="text-xs leading-snug text-amber-800 dark:text-amber-200 lg:text-right">
        {variant === 'past'
          ? t('balance.recordBalancesPendingPast', { month })
          : t('balance.recordBalancesPendingCurrent', { month })}
      </p>
    );
  }

  return (
    <div className="space-y-2 text-left text-xs leading-snug text-amber-900 dark:text-amber-100 lg:text-right">
      <p className="font-medium">
        {t('balance.recordBalancesPendingListTitle', { month })}
      </p>
      <ul className="list-inside list-disc space-y-0.5 text-amber-800 dark:text-amber-200">
        {missingItems.map((item) => (
          <li key={`${item.type}-${item.id}`}>
            {t('balance.recordBalancesPendingListItem', {
              name: item.name,
              category: t(`categories.${item.type}.${item.category}`),
            })}
          </li>
        ))}
      </ul>
      <p className="text-amber-800/90 dark:text-amber-200/90">
        {t('balance.recordBalancesPendingZeroHint')}
      </p>
      <button
        type="button"
        onClick={onOpen}
        className="font-semibold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
      >
        {t('dashboard.diagnosis.actionUpdateBalances')}
      </button>
    </div>
  );
}

export function RecordBalancesBar({
  hasAccounts,
  pendingMonths,
  suggestedMonthKey,
  locale,
  onOpen,
  onGoToCatalog,
  onViewHistory,
  layout = 'page',
  showPendingBadge = false,
  pendingDetail,
  showHistoryLink = false,
}) {
  const { t } = useTranslation();
  const currentMonthKey = getCurrentMonthKey();
  const label =
    pendingMonths &&
    suggestedMonthKey &&
    suggestedMonthKey !== currentMonthKey
      ? t('balance.patrimony.recordBalancesFor', {
          month: formatMonthKeyLong(suggestedMonthKey, locale),
        })
      : t('balance.patrimony.recordBalances');

  const isPage = layout === 'page';

  return (
    <div
      className={
        isPage
          ? 'flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6'
          : 'flex w-full min-w-0 flex-col items-stretch gap-2 lg:w-auto lg:max-w-[18rem] lg:shrink-0 lg:items-end'
      }
    >
      {isPage ? (
        <div className="min-w-0 flex-1 lg:max-w-xl">
          <p className={`text-sm font-semibold ${ui.heading}`}>
            {t('balance.recordBalancesHeading')}
          </p>
          <p className={`mt-1 text-sm ${ui.text}`}>
            {t('balance.recordBalancesDescription')}
          </p>
          {showHistoryLink && onViewHistory ? (
            <button
              type="button"
              onClick={onViewHistory}
              className="mt-2 text-sm font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
            >
              {t('balance.viewBalanceHistory')}
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        className={
          isPage
            ? 'flex w-full min-w-0 flex-col items-stretch gap-2 lg:w-auto lg:max-w-[18rem] lg:shrink-0 lg:items-end'
            : 'contents'
        }
      >
        <div className="relative w-full lg:w-auto">
          <button
            type="button"
            className={`${ui.btnPrimary} w-full lg:w-auto`}
            disabled={!hasAccounts}
            aria-disabled={!hasAccounts}
            aria-describedby={
              hasAccounts ? 'record-balances-why' : 'record-balances-blocked'
            }
            onClick={onOpen}
          >
            {label}
          </button>
          {showPendingBadge && hasAccounts ? (
            <span
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[0.65rem] font-bold text-white"
              aria-hidden
            >
              !
            </span>
          ) : null}
        </div>

        {hasAccounts ? (
          <>
            <PendingBalancesNotice
              detail={pendingDetail}
              locale={locale}
              onOpen={onOpen}
              t={t}
            />
            <p
              id="record-balances-why"
              className={`text-xs leading-snug ${ui.textMuted} lg:text-right`}
            >
              {t('balance.patrimony.recordBalancesWhy')}
            </p>
          </>
        ) : (
          <div
            id="record-balances-blocked"
            role="status"
            className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 text-left text-xs leading-snug text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100 lg:text-right"
          >
            <p>{t('balance.patrimony.recordBalancesBlocked')}</p>
            <button
              type="button"
              className="mt-2 font-semibold underline underline-offset-2 hover:no-underline"
              onClick={onGoToCatalog}
            >
              {t('balance.patrimony.recordBalancesGoToCatalog')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
