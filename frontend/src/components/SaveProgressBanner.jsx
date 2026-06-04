import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ui } from '../lib/uiClasses';
import { useAuthModal } from '../context/AuthModalContext';
import { useSessionMeta } from '../store/hooks';

export function SaveProgressBanner() {
  const { t } = useTranslation();
  const { sessionStatus, saveBannerSnoozedUntil, snoozeSaveBanner } =
    useSessionMeta();
  const { openRegister } = useAuthModal();
  const [tick, setTick] = useState(0);

  const show = useMemo(() => {
    if (sessionStatus !== 'guest_with_data') return false;
    if (saveBannerSnoozedUntil == null) return true;
    return Date.now() >= saveBannerSnoozedUntil;
  }, [sessionStatus, saveBannerSnoozedUntil, tick]);

  useEffect(() => {
    if (!saveBannerSnoozedUntil || Date.now() >= saveBannerSnoozedUntil) {
      return undefined;
    }
    const delay = saveBannerSnoozedUntil - Date.now();
    const id = window.setTimeout(() => setTick((n) => n + 1), delay);
    return () => window.clearTimeout(id);
  }, [saveBannerSnoozedUntil]);

  if (!show) return null;

  return (
    <div
      className={ui.bannerGuest}
      role="region"
      aria-label={t('dashboard.saveBanner.aria')}
    >
      <p className={`flex-1 text-sm font-medium leading-snug ${ui.bannerGuestText}`}>
        {t('dashboard.saveBanner.message')}
      </p>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button
          type="button"
          className={ui.bannerGuestBtn}
          onClick={openRegister}
        >
          {t('dashboard.saveBanner.cta')}
        </button>
        <button
          type="button"
          className={ui.bannerGuestLater}
          onClick={snoozeSaveBanner}
        >
          {t('dashboard.saveBanner.later')}
        </button>
      </div>
    </div>
  );
}
