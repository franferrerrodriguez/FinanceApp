import { useTranslation } from 'react-i18next';
import { getCurrentMonthKey } from '../../../lib/dashboardMetrics';
import { ui } from '../../../lib/uiClasses';
import { formatMonthKeyLong } from '../../../utils/monthLabel';

function PendingBalancesNotice({ detail, t }) {
  if (!detail) return null;

  const count = detail.missingItems?.length ?? 0;
  if (count === 0) return null;

  return (
    <p className="text-xs leading-snug text-amber-700 dark:text-amber-300 lg:text-right">
      {t('balance.recordBalancesPendingShort', {
        count,
        month: detail.month,
      })}
    </p>
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
          {showPendingBadge && hasAccounts && (pendingDetail?.missingItems?.length ?? 0) > 0 ? (
            <span
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[0.65rem] font-bold text-white"
              aria-hidden
            >
              {pendingDetail.missingItems.length}
            </span>
          ) : null}
        </div>

        {hasAccounts ? (
          <>
            <PendingBalancesNotice detail={pendingDetail} t={t} />
            {!pendingDetail ? (
              <p
                id="record-balances-why"
                className={`text-xs leading-snug ${ui.textMuted} lg:text-right`}
              >
                {t('balance.patrimony.recordBalancesWhy')}
              </p>
            ) : null}
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
