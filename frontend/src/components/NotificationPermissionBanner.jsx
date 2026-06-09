import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isAuthAvailable } from '../lib/auth';
import { isSimpleAuthMode } from '../lib/authConfig';
import {
  getPushPermissionState,
  hasActivePushSubscription,
  isPushConfigured,
  subscribeToPush,
  unsubscribeFromPush,
} from '../lib/pushNotifications';
import { isPushSupported } from '../lib/platform';
import { ui } from '../lib/uiClasses';
import { useSessionMeta } from '../store/hooks';

export function NotificationPermissionBanner() {
  const { t } = useTranslation();
  const { user, sessionStatus } = useSessionMeta();
  const [permission, setPermission] = useState(() => getPushPermissionState());
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  const cloudUser =
    isAuthAvailable() &&
    !isSimpleAuthMode() &&
    sessionStatus === 'authenticated' &&
    user?.id;

  const refresh = useCallback(async () => {
    setPermission(getPushPermissionState());
    setSubscribed(await hasActivePushSubscription());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, cloudUser]);

  if (
    !cloudUser ||
    !isPushSupported() ||
    !isPushConfigured() ||
    permission === 'unsupported'
  ) {
    return null;
  }

  const handleEnable = async () => {
    setBusy(true);
    const result = await subscribeToPush(user.id);
    await refresh();
    setBusy(false);
    if (!result && Notification.permission === 'denied') {
      setPermission('denied');
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    await unsubscribeFromPush(user.id);
    await refresh();
    setBusy(false);
  };

  if (permission === 'granted' && subscribed) {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${ui.divider} border-emerald-500/30 bg-emerald-500/10`}
        role="status"
      >
        <p className={`${ui.textLabel}`}>{t('notifications.push.active')}</p>
        <button
          type="button"
          disabled={busy}
          onClick={handleDisable}
          className={`text-sm font-medium text-emerald-700 underline-offset-2 hover:underline disabled:opacity-50 dark:text-emerald-300`}
        >
          {t('notifications.push.disable')}
        </button>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <p className={`rounded-xl border px-4 py-3 text-sm ${ui.divider} ${ui.textMuted}`}>
        {t('notifications.push.denied')}
      </p>
    );
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${ui.divider} border-sky-500/30 bg-sky-500/10`}
    >
      <p className={`text-sm ${ui.textLabel}`}>{t('notifications.push.prompt')}</p>
      <button
        type="button"
        disabled={busy}
        onClick={handleEnable}
        className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold ${ui.btnPrimary}`}
      >
        {busy ? t('notifications.push.enabling') : t('notifications.push.enable')}
      </button>
    </div>
  );
}
